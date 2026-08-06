import { ImagePrompt } from "./gemini";

export interface GeneratedImageResult {
  url: string;
  status: "complete" | "failed";
  prompt: string;
  aspectRatio: string;
}

export async function generateImageForPrompt(
  promptItem: ImagePrompt
): Promise<GeneratedImageResult> {
  const serviceUrl = process.env.IMAGE_SERVICE_URL || "http://localhost:8000/generate-image";

  // 1. Try local FastAPI microservice
  try {
    const res = await fetch(serviceUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: promptItem.prompt_text,
        aspect_ratio: promptItem.aspect_ratio || "1:1",
        color_palette: promptItem.color_palette || [],
      }),
      signal: AbortSignal.timeout(6000),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.url) {
        return {
          url: data.url,
          status: "complete",
          prompt: promptItem.prompt_text,
          aspectRatio: promptItem.aspect_ratio || "1:1",
        };
      }
    }
  } catch (err) {
    // Microservice offline or timed out; use direct free pipeline
  }

  // 2. Direct high-performance free open-source image generation pipeline
  let width = 1024;
  let height = 1024;

  if (promptItem.aspect_ratio === "9:16") {
    width = 720;
    height = 1280;
  } else if (promptItem.aspect_ratio === "4:5") {
    width = 864;
    height = 1080;
  } else if (promptItem.aspect_ratio === "16:9") {
    width = 1280;
    height = 720;
  }

  const paletteText = promptItem.color_palette?.length
    ? ` color palette: ${promptItem.color_palette.join(", ")},`
    : "";

  const fullPrompt = `${promptItem.prompt_text},${paletteText} commercial photography, 8k, photorealistic, professional lighting, award winning studio shot`;
  const encoded = encodeURIComponent(fullPrompt);
  const directUrl = `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&nologo=true&enhance=true&model=flux`;

  return {
    url: directUrl,
    status: "complete",
    prompt: promptItem.prompt_text,
    aspectRatio: promptItem.aspect_ratio || "1:1",
  };
}
