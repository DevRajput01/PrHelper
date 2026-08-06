import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL || "";
const sql = postgres(connectionString, { prepare: false });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { requestId, status, prompts, assets } = body;

    console.log(`[n8n Webhook] Received callback for request ${requestId}, status: ${status}`);

    if (!requestId) {
      return NextResponse.json({ error: "Missing requestId" }, { status: 400 });
    }

    if (status) {
      await sql`
        UPDATE content_requests 
        SET status = ${status} 
        WHERE id = ${requestId};
      `;
    }

    // If n8n provided parsed prompts directly
    if (Array.isArray(prompts)) {
      for (const p of prompts) {
        await sql`
          INSERT INTO generated_prompts (
            request_id, type, prompt_text, title, description, estimated_duration_seconds, tone, aspect_ratio
          ) VALUES (
            ${requestId}, ${p.type || 'reel'}, ${p.prompt_text}, ${p.title || null}, 
            ${p.description || null}, ${p.estimated_duration_seconds || null}, 
            ${p.tone || null}, ${p.aspect_ratio || null}
          );
        `;
      }
    }

    return NextResponse.json({ success: true, message: "Webhook processed" });
  } catch (error: any) {
    console.error("Error processing n8n webhook:", error);
    return NextResponse.json(
      { error: error.message || "Webhook processing failed" },
      { status: 500 }
    );
  }
}
