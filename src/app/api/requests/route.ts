import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import postgres from "postgres";
import { processContentGeneration } from "@/lib/generator";

const connectionString = process.env.DATABASE_URL || "";
const sql = postgres(connectionString, { prepare: false });

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();

    const {
      businessName,
      description,
      industry,
      topic,
      videoType,
      durationSeconds = 30,
      colorPalette = ["#6366F1", "#8B5CF6"],
      tone = "Engaging",
    } = body;

    if (!businessName || !description) {
      return NextResponse.json(
        { error: "Business name and description are required" },
        { status: 400 }
      );
    }

    // 1. Get user ID from session or existing user
    let userId: string | null = (session?.user as any)?.id || null;

    if (!userId) {
      const anyUser = await sql`
        SELECT id FROM users ORDER BY created_at DESC LIMIT 1;
      `;
      if (anyUser.length > 0) {
        userId = anyUser[0].id;
      }
    }

    // 2. Create or find business record
    const businessRows = await sql`
      INSERT INTO businesses (user_id, name, description, industry)
      VALUES (${userId}, ${businessName}, ${description}, ${industry || null})
      RETURNING id;
    `;
    const businessId = businessRows[0].id;

    // 3. Create content request record
    const requestRows = await sql`
      INSERT INTO content_requests (
        business_id, topic, video_type, duration_seconds, color_palette, tone, status
      ) VALUES (
        ${businessId}, ${topic || null}, ${videoType || 'Reel & Shorts'}, 
        ${Number(durationSeconds)}, ${colorPalette}, ${tone}, 'pending'
      ) RETURNING id, status, created_at;
    `;
    const requestId = requestRows[0].id;

    // 4. Trigger n8n webhook if configured
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
    let n8nTriggered = false;
    if (n8nWebhookUrl) {
      fetch(n8nWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          businessId,
          businessName,
          description,
          industry,
          filters: {
            topic,
            videoType,
            durationSeconds,
            colorPalette,
            tone,
          },
        }),
      }).catch((err) => console.log("n8n webhook dispatch note:", err.message));
    }

    // 5. Trigger generator process in background
    setTimeout(async () => {
      try {
        await processContentGeneration({
          requestId,
          businessId,
          businessName,
          description,
          industry,
          topic,
          videoType,
          durationSeconds: Number(durationSeconds),
          colorPalette,
          tone,
        });
      } catch (err) {
        console.error("Background generator error:", err);
      }
    }, 100);

    return NextResponse.json({
      success: true,
      requestId,
      businessId,
      status: "pending",
    });
  } catch (error: any) {
    console.error("Error creating content request:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create content request" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";
    const topic = url.searchParams.get("topic") || "";
    const tone = url.searchParams.get("tone") || "";

    const rows = await sql`
      SELECT 
        cr.id,
        cr.business_id,
        cr.topic,
        cr.video_type,
        cr.duration_seconds,
        cr.color_palette,
        cr.tone,
        cr.status,
        cr.created_at,
        b.name as business_name,
        b.industry as business_industry,
        b.description as business_description,
        (SELECT COUNT(*) FROM generated_prompts gp WHERE gp.request_id = cr.id) as prompt_count,
        (SELECT COUNT(*) FROM generated_prompts gp WHERE gp.request_id = cr.id AND gp.is_kept = true) as kept_count
      FROM content_requests cr
      JOIN businesses b ON cr.business_id = b.id
      ORDER BY cr.created_at DESC
      LIMIT 100;
    `;

    return NextResponse.json({ requests: rows });
  } catch (error: any) {
    console.error("Error fetching content requests:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch requests" },
      { status: 500 }
    );
  }
}
