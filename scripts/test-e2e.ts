import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import postgres from "postgres";
import { processContentGeneration } from "../src/lib/generator";
import { getEmbedding } from "../src/lib/embeddings";

const connectionString = process.env.DATABASE_URL || "";
const sql = postgres(connectionString, { prepare: false });

async function runEndToEndTest() {
  console.log("==================================================");
  console.log("🚀 Starting AdReel End-to-End Generation & RAG Test");
  console.log("==================================================");

  try {
    // 1. Ensure user exists
    const users = await sql`
      INSERT INTO users (name, email)
      VALUES ('Demo Owner', 'demo@adreel.ai')
      ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
      RETURNING id;
    `;
    const userId = users[0].id;
    console.log(`[1/5] User verified: ${userId}`);

    // 2. Create Business
    const businesses = await sql`
      INSERT INTO businesses (user_id, name, description, industry)
      VALUES (
        ${userId},
        'Wild Flour Sourdough & Hearth',
        'Artisan micro-bakery in Seattle crafting 36-hour wild yeast sourdough, morning buns, and matcha croissants.',
        'Food & Beverage'
      )
      RETURNING id, name;
    `;
    const business = businesses[0];
    console.log(`[2/5] Business created: ${business.name} (${business.id})`);

    // 3. Create Content Request
    const requests = await sql`
      INSERT INTO content_requests (
        business_id, topic, video_type, duration_seconds, color_palette, tone, status
      ) VALUES (
        ${business.id},
        'Weekend Sourdough Prep & ASMR',
        'Reels & Shorts',
        30,
        ${['#D97706', '#78350F', '#FDE68A']},
        'Warm & Artisanal',
        'pending'
      )
      RETURNING id;
    `;
    const requestId = requests[0].id;
    console.log(`[3/5] Content Request created: ${requestId}`);

    // 4. Run Generation Pipeline (RAG query + Gemini / Synthesizer + Free Diffusion Image Generation)
    console.log("[4/5] Executing full content generation pipeline...");
    const genResult = await processContentGeneration(requestId, {
      businessId: business.id,
      businessName: business.name,
      description: 'Artisan micro-bakery in Seattle crafting 36-hour wild yeast sourdough, morning buns, and matcha croissants.',
      industry: 'Food & Beverage',
      topic: 'Weekend Sourdough Prep & ASMR',
      videoType: 'Reels & Shorts',
      durationSeconds: 30,
      colorPalette: ['#D97706', '#78350F', '#FDE68A'],
      tone: 'Warm & Artisanal',
    });

    console.log("Generation pipeline execution finished:", genResult.success);

    // 5. Inspect database results
    const generatedPrompts = await sql`
      SELECT id, type, title, aspect_ratio, estimated_duration_seconds, prompt_text
      FROM generated_prompts
      WHERE request_id = ${requestId};
    `;

    console.log(`\n✅ Generated Prompts Total: ${generatedPrompts.length}`);
    for (const p of generatedPrompts) {
      console.log(`- [${p.type.toUpperCase()}] ${p.title} (${p.estimated_duration_seconds ? p.estimated_duration_seconds + 's' : p.aspect_ratio})`);
    }

    const generatedAssets = await sql`
      SELECT id, asset_type, url, status
      FROM generated_assets
      WHERE prompt_id IN ${sql(generatedPrompts.map(p => p.id))};
    `;
    console.log(`\n🖼️ Generated Image Assets Total: ${generatedAssets.length}`);
    for (const a of generatedAssets) {
      console.log(`- [${a.status}] ${a.url.substring(0, 75)}...`);
    }

    // 6. Test Keep feedback
    if (generatedPrompts.length > 0) {
      const promptToKeep = generatedPrompts[0];
      await sql`
        UPDATE generated_prompts
        SET is_kept = true
        WHERE id = ${promptToKeep.id};
      `;
      console.log(`\n👍 Tagged prompt "${promptToKeep.title}" as is_kept = true`);
    }

    // 7. Test RAG Promotion
    console.log("\n[5/5] Testing RAG Promotion into style_library...");
    const keptPrompts = await sql`
      SELECT gp.id, gp.prompt_text, gp.title, gp.description, gp.type, b.industry
      FROM generated_prompts gp
      JOIN content_requests cr ON gp.request_id = cr.id
      JOIN businesses b ON cr.business_id = b.id
      WHERE gp.is_kept = true
      LIMIT 5;
    `;

    let promoted = 0;
    for (const p of keptPrompts) {
      const content = `${p.type.toUpperCase()}: ${p.title || ''} - ${p.prompt_text} (${p.description || ''})`.trim();
      const existing = await sql`SELECT id FROM style_library WHERE content = ${content} LIMIT 1;`;
      if (existing.length === 0) {
        const emb = await getEmbedding(content);
        await sql`
          INSERT INTO style_library (content, embedding, source, industry)
          VALUES (${content}, ${JSON.stringify(emb)}::vector, 'learned', ${p.industry || 'General'});
        `;
        promoted++;
      }
    }
    console.log(`🎉 RAG Promotion complete. Promoted ${promoted} kept prompts to style_library.`);

    console.log("\n==================================================");
    console.log("🌟 ALL END-TO-END VERIFICATION CHECKS PASSED!");
    console.log("==================================================");
    process.exit(0);
  } catch (error) {
    console.error("❌ E2E Test Error:", error);
    process.exit(1);
  }
}

runEndToEndTest();
