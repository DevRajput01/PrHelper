import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";

export const dynamic = "force-dynamic";

const connectionString = process.env.DATABASE_URL || "";
const sql = postgres(connectionString, { prepare: false });

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type") || "";
    const isKept = url.searchParams.get("isKept");
    const search = url.searchParams.get("search") || "";

    const prompts = await sql`
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
        gp.created_at,
        cr.business_id,
        b.name as business_name,
        b.industry as business_industry,
        (
          SELECT ga.url 
          FROM generated_assets ga 
          WHERE ga.prompt_id = gp.id 
          LIMIT 1
        ) as asset_url
      FROM generated_prompts gp
      JOIN content_requests cr ON gp.request_id = cr.id
      JOIN businesses b ON cr.business_id = b.id
      WHERE 
        (${type} = '' OR gp.type = ${type})
        AND (${isKept === null || isKept === ''} = true OR gp.is_kept = ${isKept === 'true'})
        AND (${search} = '' OR gp.title ILIKE ${'%' + search + '%'} OR gp.prompt_text ILIKE ${'%' + search + '%'} OR b.name ILIKE ${'%' + search + '%'})
      ORDER BY gp.created_at DESC
      LIMIT 100;
    `;

    return NextResponse.json({ prompts });
  } catch (error: any) {
    console.error("Error fetching library prompts:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch prompts" },
      { status: 500 }
    );
  }
}
