import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";
import { getEmbedding } from "@/lib/embeddings";

const connectionString = process.env.DATABASE_URL || "";
const sql = postgres(connectionString, { prepare: false });

export async function POST(req: NextRequest) {
  try {
    console.log("[RAG Promotion] Checking for high-performing kept prompts to promote...");

    // Find prompts where is_kept = true
    const keptPrompts = await sql`
      SELECT 
        gp.id,
        gp.prompt_text,
        gp.title,
        gp.description,
        gp.type,
        b.industry
      FROM generated_prompts gp
      JOIN content_requests cr ON gp.request_id = cr.id
      JOIN businesses b ON cr.business_id = b.id
      WHERE gp.is_kept = true
      ORDER BY gp.created_at DESC
      LIMIT 20;
    `;

    let promotedCount = 0;

    for (const prompt of keptPrompts) {
      const content = `${prompt.type.toUpperCase()}: ${prompt.title || ''} - ${prompt.prompt_text} (${prompt.description || ''})`.trim();

      // Check if already in style_library
      const existing = await sql`
        SELECT id FROM style_library WHERE content = ${content} LIMIT 1;
      `;

      if (existing.length === 0) {
        const emb = await getEmbedding(content);
        const vecStr = `[${emb.join(",")}]`;

        await sql`
          INSERT INTO style_library (content, embedding, source, industry)
          VALUES (${content}, ${vecStr}::vector, 'learned', ${prompt.industry || 'General'});
        `;
        promotedCount++;
      }
    }

    console.log(`[RAG Promotion] Promoted ${promotedCount} kept prompts to style_library.`);

    return NextResponse.json({
      success: true,
      promotedCount,
      totalKeptScanned: keptPrompts.length,
    });
  } catch (error: any) {
    console.error("Error promoting kept prompts to style library:", error);
    return NextResponse.json(
      { error: error.message || "Failed to promote prompts" },
      { status: 500 }
    );
  }
}
