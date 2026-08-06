import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sql } from "@/db";
import { queryStyleLibrary } from "@/lib/rag";
import { generateSingleItem } from "@/lib/gemini";
import { generateImageForPrompt } from "@/lib/images";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();

    const {
      businessName,
      topic,
      type, // 'reel' | 'short' | 'image'
      industry = "General Business",
      tone = "Engaging & Authentic",
      durationSeconds = 30,
      colorPalette = ["#6366F1", "#10B981"],
    } = body;

    if (!businessName) {
      return NextResponse.json(
        { error: "Please provide a business name" },
        { status: 400 }
      );
    }

    if (!type || !["reel", "short", "image"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type. Must be 'reel', 'short', or 'image'" },
        { status: 400 }
      );
    }

    const businessTopic = topic || `${businessName} Brand Story & Quality`;

    // 1. Get logged in user ID or find existing user
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
      VALUES (${userId}, ${businessName}, ${businessTopic}, ${industry})
      RETURNING id;
    `;
    const businessId = businessRows[0].id;

    // 3. Create content request record
    const requestRows = await sql`
      INSERT INTO content_requests (
        business_id, topic, video_type, duration_seconds, color_palette, tone, status
      ) VALUES (
        ${businessId}, ${businessTopic}, ${type}, ${durationSeconds}, ${colorPalette}, ${tone}, 'complete'
      ) RETURNING id;
    `;
    const requestId = requestRows[0].id;

    // 4. Query pgvector RAG for style inspirations
    const ragMatches = await queryStyleLibrary(`${businessName} ${businessTopic}`, 3);
    const ragText = ragMatches.length > 0
      ? ragMatches.map((m, i) => `Inspiration #${i + 1}: ${m.content}`).join("\n")
      : "High-impact modern marketing style.";

    // 5. Generate targeted content using Gemini (or dynamic fallback)
    const apiKey = process.env.GEMINI_API_KEY;
    let generatedItem: any = null;

    if (apiKey) {
      const promptGoal =
        type === "reel"
          ? `Generate 1 viral Instagram Reel script (hook, visual scenes, and CTA) for "${businessName}" promoting "${businessTopic}". Duration: ${durationSeconds}s. Tone: ${tone}.`
          : type === "short"
          ? `Generate 1 YouTube Short script with numbered scene beats (0-3s hook, fast middle, CTA) for "${businessName}" promoting "${businessTopic}". Tone: ${tone}.`
          : `Generate 1 photorealistic commercial studio photography prompt for "${businessName}" promoting "${businessTopic}". Aesthetic: 8k Hasselblad, dramatic rim lighting, minimalist.`;

      const systemPrompt = `You are an expert marketing strategist. Output ONLY valid JSON matching this schema:
{
  "title": "catchy title under 60 chars",
  "prompt_text": "detailed scene breakdown or image prompt",
  "description": "caption with hashtags under 200 chars",
  "aspect_ratio": "1:1",
  "estimated_duration_seconds": ${durationSeconds}
}`;

      const candidateModels = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-pro"];
      for (const model of candidateModels) {
        try {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\nContext:\n${ragText}\n\nRequest:\n${promptGoal}` }] }],
              generationConfig: { temperature: 0.7, maxOutputTokens: 1000, responseMimeType: "application/json" },
            }),
          });
          if (res.ok) {
            const data = await res.json();
            const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (raw) {
              const clean = raw.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/```\s*$/, "").trim();
              const parsed = JSON.parse(clean);
              if (parsed && parsed.title && parsed.prompt_text) {
                generatedItem = parsed;
                break;
              }
            }
          }
        } catch (e) {
          console.warn(`[SingleGen] Model ${model} failed, trying next...`);
        }
      }
    }

    // High-intelligence domain-aware synthesizer if Gemini API is busy or unconfigured
    if (!generatedItem) {
      generatedItem = generateSingleItem(
        type as "reel" | "short" | "image",
        businessName,
        businessTopic,
        industry,
        tone,
        durationSeconds
      );
    }

    // 6. Insert generated prompt into database
    const insertedPrompt = await sql`
      INSERT INTO generated_prompts (
        request_id, type, prompt_text, title, description, estimated_duration_seconds, aspect_ratio, tone
      ) VALUES (
        ${requestId}, ${type}, ${generatedItem.prompt_text}, ${generatedItem.title}, 
        ${generatedItem.description || ''}, ${generatedItem.estimated_duration_seconds || durationSeconds}, 
        ${generatedItem.aspect_ratio || '1:1'}, ${tone}
      ) RETURNING id, request_id, type, prompt_text, title, description, estimated_duration_seconds, aspect_ratio, tone, is_kept, created_at;
    `;

    const promptRecord = insertedPrompt[0];
    let assetRecord: any = null;

    // 7. If image, generate actual image visual immediately
    if (type === "image") {
      const imgRes = await generateImageForPrompt({
        id: promptRecord.id,
        prompt_text: promptRecord.prompt_text,
        title: promptRecord.title,
        description: promptRecord.description || "",
        aspect_ratio: promptRecord.aspect_ratio || "1:1",
        color_palette: colorPalette || [],
      });

      const insertedAsset = await sql`
        INSERT INTO generated_assets (
          prompt_id, asset_type, url, status
        ) VALUES (
          ${promptRecord.id}, 'image', ${imgRes.url}, ${imgRes.status}
        ) RETURNING id, url, status;
      `;
      assetRecord = insertedAsset[0];
    }

    return NextResponse.json({
      success: true,
      prompt: {
        ...promptRecord,
        assets: assetRecord ? [assetRecord] : [],
      },
    });
  } catch (error: any) {
    console.error("[SingleGen] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate item" },
      { status: 500 }
    );
  }
}
