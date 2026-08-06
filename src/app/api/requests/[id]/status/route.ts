import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL || "";
const sql = postgres(connectionString, { prepare: false });

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const requestId = params.id;

    if (!requestId) {
      return NextResponse.json({ error: "Missing request ID" }, { status: 400 });
    }

    // 1. Fetch content request with business info
    const requestRows = await sql`
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
        b.description as business_description,
        b.industry as business_industry
      FROM content_requests cr
      JOIN businesses b ON cr.business_id = b.id
      WHERE cr.id = ${requestId}
      LIMIT 1;
    `;

    if (requestRows.length === 0) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const requestData = requestRows[0];

    // 2. Fetch generated prompts
    const promptRows = await sql`
      SELECT 
        gp.id,
        gp.request_id,
        gp.type,
        gp.prompt_text,
        gp.title,
        gp.description,
        gp.estimated_duration_seconds,
        gp.tone,
        gp.aspect_ratio,
        gp.color_palette,
        gp.is_kept,
        gp.created_at
      FROM generated_prompts gp
      WHERE gp.request_id = ${requestId}
      ORDER BY gp.created_at ASC, gp.type DESC;
    `;

    // 3. Fetch assets for all prompts of this request
    const promptIds = promptRows.map((p) => p.id);
    let assetsByPromptId: Record<string, any[]> = {};

    if (promptIds.length > 0) {
      const assetRows = await sql`
        SELECT 
          ga.id,
          ga.prompt_id,
          ga.asset_type,
          ga.url,
          ga.status,
          ga.created_at
        FROM generated_assets ga
        WHERE ga.prompt_id IN ${sql(promptIds)}
        ORDER BY ga.created_at ASC;
      `;

      assetRows.forEach((asset) => {
        if (!assetsByPromptId[asset.prompt_id]) {
          assetsByPromptId[asset.prompt_id] = [];
        }
        assetsByPromptId[asset.prompt_id].push(asset);
      });
    }

    // Combine prompts with assets
    const prompts = promptRows.map((p: any) => ({
      ...p,
      assets: assetsByPromptId[p.id] || [],
    }));

    return NextResponse.json({
      request: requestData,
      prompts,
      reels: prompts.filter((p: any) => p.type === "reel"),
      shorts: prompts.filter((p: any) => p.type === "short"),
      images: prompts.filter((p: any) => p.type === "image"),
      status: requestData.status,
    });
  } catch (error: any) {
    console.error("Error fetching request status:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch request status" },
      { status: 500 }
    );
  }
}
