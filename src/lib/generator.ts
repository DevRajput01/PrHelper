import { sql } from "../db";
import { queryStyleLibrary } from "./rag";
import { generateMarketingContent } from "./gemini";
import { generateImageForPrompt } from "./images";
import { getEmbedding } from "./embeddings";

export interface ProcessGenerationParams {
  requestId: string;
  businessId: string;
  businessName: string;
  description: string;
  industry?: string;
  topic?: string;
  videoType?: string;
  durationSeconds?: number;
  colorPalette?: string[];
  tone?: string;
}

export async function processContentGeneration(
  paramsOrRequestId: ProcessGenerationParams | string,
  maybeParams?: Omit<ProcessGenerationParams, "requestId">
) {
  const params: ProcessGenerationParams =
    typeof paramsOrRequestId === "string"
      ? { requestId: paramsOrRequestId, ...maybeParams! }
      : paramsOrRequestId;

  const {
    requestId,
    businessId,
    businessName,
    description,
    industry,
    topic,
    videoType,
    durationSeconds,
    colorPalette,
    tone,
  } = params;

  console.log(`[Generator] Starting generation for request ${requestId} (${businessName})...`);

  try {
    // 1. Update request status to 'processing'
    await sql`
      UPDATE content_requests 
      SET status = 'processing'
      WHERE id = ${requestId};
    `;

    // 2. Embed business description & update business embedding if not set
    const businessEmbedding = await getEmbedding(`${businessName} ${description} ${industry || ''}`);
    const embStr = `[${businessEmbedding.join(",")}]`;
    await sql`
      UPDATE businesses
      SET embedding = ${embStr}::vector
      WHERE id = ${businessId} AND embedding IS NULL;
    `;

    // 3. Query pgvector in NeonDB for RAG context (top 5 matches)
    console.log(`[Generator] Fetching RAG context for ${industry || 'business'}...`);
    const ragContext = await queryStyleLibrary(`${businessName} ${description} ${topic || ''}`, 5);
    console.log(`[Generator] Retrieved ${ragContext.length} style library matches.`);

    // 4. Call Gemini LLM with system prompt + business info + filters + RAG context
    console.log(`[Generator] Synthesizing marketing content via Gemini...`);
    const generated = await generateMarketingContent({
      businessName,
      description,
      industry,
      topic,
      videoType,
      durationSeconds,
      colorPalette,
      tone,
      ragContext,
    });

    // 5. Insert Reel prompts
    for (const reel of generated.reel_prompts) {
      await sql`
        INSERT INTO generated_prompts (
          request_id, type, prompt_text, title, description, estimated_duration_seconds, tone
        ) VALUES (
          ${requestId}, 'reel', ${reel.prompt_text}, ${reel.title}, ${reel.description}, 
          ${reel.estimated_duration_seconds || durationSeconds || 30}, ${reel.tone || tone || 'Engaging'}
        );
      `;
    }

    // 6. Insert Shorts prompts
    for (const short of generated.shorts_prompts) {
      await sql`
        INSERT INTO generated_prompts (
          request_id, type, prompt_text, title, description, estimated_duration_seconds, tone
        ) VALUES (
          ${requestId}, 'short', ${short.prompt_text}, ${short.title}, ${short.description}, 
          ${short.estimated_duration_seconds || durationSeconds || 30}, ${short.tone || tone || 'Punchy'}
        );
      `;
    }

    // 7. Process Image prompts & generate images
    console.log(`[Generator] Generating images for ${generated.image_prompts.length} visual prompts...`);
    for (const img of generated.image_prompts) {
      const inserted = await sql`
        INSERT INTO generated_prompts (
          request_id, type, prompt_text, title, description, aspect_ratio, color_palette, tone
        ) VALUES (
          ${requestId}, 'image', ${img.prompt_text}, ${img.title}, ${img.description}, 
          ${img.aspect_ratio || '1:1'}, ${img.color_palette && img.color_palette.length ? img.color_palette : colorPalette || []}, ${tone || 'Creative'}
        ) RETURNING id;
      `;

      const promptId = inserted[0]?.id;

      if (promptId) {
        // Generate actual image via free pipeline
        const imgResult = await generateImageForPrompt(img);

        await sql`
          INSERT INTO generated_assets (
            prompt_id, asset_type, url, status
          ) VALUES (
            ${promptId}, 'image', ${imgResult.url}, ${imgResult.status}
          );
        `;
      }
    }

    // 8. Mark request as 'complete'
    await sql`
      UPDATE content_requests 
      SET status = 'complete'
      WHERE id = ${requestId};
    `;

    console.log(`[Generator] Generation completed successfully for request ${requestId}`);
    return { success: true, requestId };
  } catch (error) {
    console.error(`[Generator] Error during generation for request ${requestId}:`, error);

    await sql`
      UPDATE content_requests 
      SET status = 'failed'
      WHERE id = ${requestId};
    `;

    return { success: false, error };
  }
}
