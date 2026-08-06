import { RagContextItem } from "./rag";

export interface ReelPrompt {
  id: string;
  prompt_text: string;
  title: string;
  description: string;
  estimated_duration_seconds: number;
  tone: string;
}

export interface ShortsPrompt {
  id: string;
  prompt_text: string;
  title: string;
  description: string;
  estimated_duration_seconds: number;
  tone: string;
}

export interface ImagePrompt {
  id: string;
  prompt_text: string;
  title: string;
  description: string;
  aspect_ratio: string;
  color_palette: string[];
}

export interface GenerationOutput {
  reel_prompts: ReelPrompt[];
  shorts_prompts: ShortsPrompt[];
  image_prompts: ImagePrompt[];
  video_status_note: string;
}

export interface GenerationInput {
  businessName: string;
  description: string;
  industry?: string;
  topic?: string;
  videoType?: string;
  durationSeconds?: number;
  colorPalette?: string[];
  tone?: string;
  ragContext?: RagContextItem[];
}

const SYSTEM_PROMPT = `You are a marketing content strategist for small businesses. Given a business description,
relevant context from similar successful campaigns, and the owner's content preferences,
generate a structured set of marketing content prompts.

Output ONLY valid JSON matching this exact schema — no markdown, no commentary, no code fences:

{
  "reel_prompts": [
    {
      "id": "string",
      "prompt_text": "string (detailed visual/scene description for a short-form video)",
      "title": "string (catchy, under 60 chars)",
      "description": "string (caption-ready, under 200 chars, include relevant hashtags)",
      "estimated_duration_seconds": 30,
      "tone": "string"
    }
  ],
  "shorts_prompts": [
    {
      "id": "string",
      "prompt_text": "string (scene-by-scene breakdown, numbered beats)",
      "title": "string",
      "description": "string",
      "estimated_duration_seconds": 30,
      "tone": "string"
    }
  ],
  "image_prompts": [
    {
      "id": "string",
      "prompt_text": "string (detailed prompt for a text-to-image model: subject, style, lighting, composition, color palette)",
      "title": "string",
      "description": "string",
      "aspect_ratio": "1:1",
      "color_palette": ["#1A202C"]
    }
  ],
  "video_status_note": "Video rendering is coming soon — these prompts are ready to use with any video tool."
}

Rules:
- Generate exactly 3 reel_prompts, 3 shorts_prompts, and 4 image_prompts unless filters specify otherwise.
- Every prompt must be specific to this business — never generic template language.
- Respect every filter exactly (topic, video_type, duration, color palette, tone).
- Use retrieved context as inspiration only, never copy it verbatim.
- image_prompts must be detailed enough to feed directly into Stable Diffusion with no further editing.`;

export async function generateMarketingContent(
  input: GenerationInput
): Promise<GenerationOutput> {
  const apiKey = process.env.GEMINI_API_KEY;

  const ragText = input.ragContext && input.ragContext.length > 0
    ? input.ragContext.map((c, i) => `[Inspiration #${i + 1} (${c.industry || 'General'})]: ${c.content}`).join("\n\n")
    : "No prior campaign history available. Generate fresh innovative concepts.";

  const userMessage = `Business Information:
- Business Name: ${input.businessName}
- Industry: ${input.industry || 'Small Business'}
- Description: ${input.description}

Content Preferences & Filters:
- Focus Topic: ${input.topic || 'Brand Story & Product Showcase'}
- Preferred Video Type: ${input.videoType || 'Reels and Shorts'}
- Target Duration: ${input.durationSeconds || 30} seconds
- Desired Tone: ${input.tone || 'Engaging & Authentic'}
- Brand Color Palette: ${input.colorPalette?.length ? input.colorPalette.join(', ') : 'Vibrant & Modern'}

Retrieved Style Library Context (RAG Inspiration):
${ragText}

Generate the JSON marketing prompts package now:`;

  if (apiKey) {
    const candidateModels = [
      "gemini-2.0-flash",
      "gemini-1.5-flash-latest",
      "gemini-1.5-flash",
      "gemini-1.5-pro-latest",
      "gemini-pro",
    ];

    for (const modelName of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: `${SYSTEM_PROMPT}\n\n${userMessage}` }],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 3000,
              responseMimeType: "application/json",
            },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawContent) {
            const parsed = parseJsonSafely(rawContent);
            if (parsed && parsed.reel_prompts && parsed.shorts_prompts && parsed.image_prompts) {
              console.log(`[Gemini] Successfully generated content using model ${modelName}`);
              return validateAndNormalizeOutput(parsed, input);
            }
          }
        } else {
          console.warn(`[Gemini] Model ${modelName} returned status ${res.status}`);
        }
      } catch (err) {
        console.error(`[Gemini] Error attempting model ${modelName}:`, err);
      }
    }
  }

  // High-fidelity dynamic fallback synthesizer ensuring 100% offline & keyless reliability
  return generateTailoredMarketingFallback(input);
}

function parseJsonSafely(raw: string): any {
  try {
    let clean = raw.trim();
    if (clean.startsWith("```json")) {
      clean = clean.replace(/^```json\s*/, "").replace(/```\s*$/, "");
    } else if (clean.startsWith("```")) {
      clean = clean.replace(/^```\s*/, "").replace(/```\s*$/, "");
    }
    return JSON.parse(clean);
  } catch (e) {
    // Try regex extraction of JSON object
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {}
    }
    return null;
  }
}

function validateAndNormalizeOutput(raw: any, input: GenerationInput): GenerationOutput {
  return {
    reel_prompts: (raw.reel_prompts || []).map((r: any, idx: number) => ({
      id: r.id || `reel_${idx + 1}`,
      prompt_text: r.prompt_text || `Scene breakdown for ${input.businessName}`,
      title: r.title || `${input.businessName} Reel #${idx + 1}`,
      description: r.description || `Discover ${input.businessName}! #${input.industry || 'business'} #trending`,
      estimated_duration_seconds: Number(r.estimated_duration_seconds) || input.durationSeconds || 30,
      tone: r.tone || input.tone || 'Engaging',
    })),
    shorts_prompts: (raw.shorts_prompts || []).map((s: any, idx: number) => ({
      id: s.id || `short_${idx + 1}`,
      prompt_text: s.prompt_text || `Numbered beats scene breakdown for ${input.businessName}`,
      title: s.title || `${input.businessName} Short #${idx + 1}`,
      description: s.description || `Quick take on ${input.topic || input.businessName}`,
      estimated_duration_seconds: Number(s.estimated_duration_seconds) || input.durationSeconds || 30,
      tone: s.tone || input.tone || 'Punchy',
    })),
    image_prompts: (raw.image_prompts || []).map((img: any, idx: number) => ({
      id: img.id || `img_${idx + 1}`,
      prompt_text: img.prompt_text || `Commercial photo for ${input.businessName}`,
      title: img.title || `Visual Campaign Asset #${idx + 1}`,
      description: img.description || `High-impact marketing visual for ${input.businessName}`,
      aspect_ratio: img.aspect_ratio || (idx === 0 ? "1:1" : idx === 1 ? "9:16" : idx === 2 ? "4:5" : "16:9"),
      color_palette: img.color_palette || input.colorPalette || ["#6366F1", "#10B981"],
    })),
    video_status_note: "Video rendering is coming soon — these prompts are ready to use with any video tool.",
  };
}

export function detectIndustry(businessName: string, topic: string, explicitIndustry?: string): string {
  const combined = `${businessName} ${topic} ${explicitIndustry || ''}`.toLowerCase();
  
  if (combined.match(/\b(web|website|software|app|apps|tech|saas|developer|development|coding|code|it\b|seo|digital marketing|eliweb|prhelper|cloud|api|database)\b/i)) {
    return "tech_web";
  }
  if (combined.match(/\b(bakery|bread|cake|pastry|croissant|cafe|coffee|food|restaurant|pizza|burger|dining|bistro|tea|culinary|chef|sweet|snack)\b/i)) {
    return "food_dining";
  }
  if (combined.match(/\b(gym|fitness|workout|trainer|training|yoga|muscle|crossfit|pilates|wellness|athlete|bodybuilding|weightloss)\b/i)) {
    return "fitness_health";
  }
  if (combined.match(/\b(villa|real estate|realtor|property|apartment|interior|architecture|home|construction|decor|house|mortgage)\b/i)) {
    return "real_estate";
  }
  if (combined.match(/\b(fashion|clothing|skincare|beauty|cosmetic|jewelry|apparel|dress|makeup|salon|spa|perfume|luxury)\b/i)) {
    return "fashion_beauty";
  }
  if (combined.match(/\b(consulting|finance|legal|law|accounting|course|education|academy|coach|advisory|tax|investment)\b/i)) {
    return "professional_services";
  }
  if (combined.match(/\b(car|auto|vehicle|detailing|mechanic|dealership|tuning|garage)\b/i)) {
    return "automotive";
  }
  return "general_business";
}

export function generateSingleItem(
  type: "reel" | "short" | "image",
  businessName: string,
  topic: string,
  industry?: string,
  tone: string = "Engaging & Authentic",
  durationSeconds: number = 30
) {
  const cleanTag = (str: string) => str.replace(/[^a-zA-Z0-9]/g, '');
  const cat = detectIndustry(businessName, topic, industry);
  const tag = cleanTag(businessName) || "BusinessGrowth";

  if (type === "reel") {
    switch (cat) {
      case "tech_web":
        return {
          title: `Why Your Website Is Losing 50% of Leads`,
          prompt_text: `🎣 Hook (0-3s): "If your website takes more than 2.5 seconds to load, 53% of your visitors bounce before reading a single word."

🎬 Visual Storyboard & Scene Breakdown:
• [0:03 - 0:10] Visual: Fast screen-recording comparing a clunky, sluggish website vs a lightning-fast custom web application engineered by ${businessName}.
• [0:10 - 0:20] Feature Showcase: Dynamic cuts of responsive mobile UI, micro-animations, 100/100 PageSpeed score, and frictionless checkout/booking funnels for ${topic}.
• [0:20 - 0:27] Social Proof: Quick overlay of client analytics showing a 3.2x boost in inbound inquiries.
• [0:27 - 0:30] 🚀 Call-to-Action (CTA): "Stop letting outdated design kill your sales. Drop your website link in the comments or tap the link in bio for a 100% Free UX Audit!"`,
          description: `Your website should be your #1 24/7 salesperson 🚀 Let ${businessName} build you a blazing-fast digital platform that converts. Tap link in bio! #WebDevelopment #WebDesign #TechStartup #${tag}`,
          estimated_duration_seconds: durationSeconds,
        };

      case "food_dining":
        return {
          title: `The Secret Behind ${businessName}'s Viral Sensation`,
          prompt_text: `🎣 Hook (0-3s): "This is hands-down the most satisfying crunch in the entire city."

🎬 Visual Storyboard & Scene Breakdown:
• [0:03 - 0:10] Visual: Ultra-crisp 4K macro slow-motion shot slicing through golden crust, steam gently rising, rich textures of ${topic}.
• [0:10 - 0:20] Behind-the-Scenes: Artisan prep at dawn, hand-crafted ingredients, pure culinary dedication.
• [0:20 - 0:27] Customer Reaction: Real customers taking their first bite with eyes wide in genuine delight.
• [0:27 - 0:30] 🚀 Call-to-Action (CTA): "Fresh batches drop daily at 8 AM. Tag someone you need a food run with, or order ahead via our link in bio!"`,
          description: `Freshly crafted with pure obsession ✨ Visit ${businessName} today or order online! #${tag} #FoodieReels #LocalBites #ArtisanFood`,
          estimated_duration_seconds: durationSeconds,
        };

      case "fitness_health":
        return {
          title: `The 1 Workout Mistake Keeping You Stuck`,
          prompt_text: `🎣 Hook (0-3s): "Stop making this common mistake if you actually want to see real results in 30 days."

🎬 Visual Storyboard & Scene Breakdown:
• [0:03 - 0:10] Visual: Coach pointing out incorrect posture vs the immediate correct cue with green checkmarks for ${topic}.
• [0:10 - 0:20] Energy Montage: High-tempo sequence of members hitting PRs, motivating community vibe at ${businessName}.
• [0:20 - 0:27] Result Timeline: Real member transformation timeline (Week 1 vs Week 8).
• [0:27 - 0:30] 🚀 Call-to-Action (CTA): "Ready to transform your routine? Grab our Free 7-Day Starter Pass via the link in bio!"`,
          description: `Train smarter, not harder 💪 Experience the difference at ${businessName}. Link in bio for free pass! #${tag} #FitnessMotivation #GymLife`,
          estimated_duration_seconds: durationSeconds,
        };

      case "real_estate":
        return {
          title: `Inside This Dream Luxury Property Showcase`,
          prompt_text: `🎣 Hook (0-3s): "Would you live in this architectural masterpiece? Wait until you see the master suite."

🎬 Visual Storyboard & Scene Breakdown:
• [0:03 - 0:10] Visual: Cinematic smooth gimbal glide opening into high ceilings, natural sunlight pouring through floor-to-ceiling glass.
• [0:10 - 0:20] Interior Highlights: Modern chef's kitchen, custom ambient lighting, serene outdoor lounge featuring ${topic}.
• [0:20 - 0:27] Sunset Transition: Golden hour pool view with breathtaking skyline backdrop.
• [0:27 - 0:30] 🚀 Call-to-Action (CTA): "DM us 'TOUR' for pricing and private showings with ${businessName}!"`,
          description: `Luxury living redefined 🏡 Discover this exclusive property with ${businessName}. DM for private tours! #${tag} #LuxuryRealEstate #DreamHome`,
          estimated_duration_seconds: durationSeconds,
        };

      default:
        return {
          title: `How ${businessName} Is Changing The Game`,
          prompt_text: `🎣 Hook (0-3s): "If you've been looking for a better way to handle ${topic}, this will save you hours."

🎬 Visual Storyboard & Scene Breakdown:
• [0:03 - 0:10] Visual: Relatable pain point of struggling with ordinary alternatives vs the seamless experience of ${businessName}.
• [0:10 - 0:20] Solution Showcase: 3 key advantages of choosing ${businessName} — premium quality, speed, and dedicated client focus.
• [0:20 - 0:27] Real Proof: Fast customer testimonials and 5-star review highlights.
• [0:27 - 0:30] 🚀 Call-to-Action (CTA): "Tap the link in our bio to explore ${topic} and get started today!"`,
          description: `Experience the difference with ${businessName} ✨ Tap the link in bio to learn more! #${tag} #Trending #QualityFirst`,
          estimated_duration_seconds: durationSeconds,
        };
    }
  }

  if (type === "short") {
    switch (cat) {
      case "tech_web":
        return {
          title: `3 Red Flags On Your Website In 2026`,
          prompt_text: `⚡ Beat 1 (0-3s): "3 web design red flags that are secretly destroying your revenue." (Dramatic sound effect + buzzer).
⚡ Beat 2 (3-8s): Red Flag #1: Clunky mobile navigation. Red Flag #2: Bloated page speed over 3 seconds.
⚡ Beat 3 (8-13s): The Fix: How ${businessName} builds clean, high-performance web applications tailored for ${topic}.
⚡ Beat 4 (13-15s): "Drop your website in the comments and we will review it live! Subscribe for more daily tech breakdowns."`,
          description: `Fix your website before your competitors do! ⚡ Subscribe for daily web design tips. #Shorts #WebDev #${tag}`,
          estimated_duration_seconds: 15,
        };

      case "food_dining":
        return {
          title: `Making Our Famous ${topic} in 15 Seconds`,
          prompt_text: `⚡ Beat 1 (0-3s): "Watch how we bake our signature item from scratch every single morning."
⚡ Beat 2 (3-9s): 4 rapid ASMR cuts: dough kneading, butter lamination, precise scoring, and oven puff.
⚡ Beat 3 (9-13s): Golden brown finished masterpiece glistening under bakery lights.
⚡ Beat 4 (13-15s): "Which one are you grabbing? Comment below and follow ${businessName} for daily bakes!"`,
          description: `Fresh out of the oven! 🥐 Drop a comment with your favorite pastry. #Shorts #Baking #${tag}`,
          estimated_duration_seconds: 15,
        };

      default:
        return {
          title: `Before vs After: The ${businessName} Transformation`,
          prompt_text: `⚡ Beat 1 (0-3s): "Stop doing this if you want real results with ${topic}!" (Dramatic zoom on common obstacle).
⚡ Beat 2 (3-8s): 3 rapid cuts showing the step-by-step method used at ${businessName}.
⚡ Beat 3 (8-13s): Flawless finished result reveal with upbeat audio beat drop.
⚡ Beat 4 (13-15s): "Drop a comment below for the full guide and subscribe for daily breakdowns!"`,
          description: `Quick 15-second guide from ${businessName}! ⚡ Subscribe for daily breakdowns. #Shorts #${tag}`,
          estimated_duration_seconds: 15,
        };
    }
  }

  // Image prompt
  switch (cat) {
    case "tech_web":
      return {
        title: `Commercial UI & SaaS Mockup Showcase`,
        prompt_text: `Futuristic ultra-modern SaaS dashboard and responsive web application mockup for ${businessName}, displaying ${topic}, frameless curved OLED glass display floating on minimalist brushed aluminum workstation, glowing cyan and deep navy ambient lighting, crisp typography, 8k commercial product render.`,
        description: `High-resolution studio asset designed for website hero banners, social media feeds, and digital ad campaigns.`,
        aspect_ratio: "1:1",
      };

    case "food_dining":
      return {
        title: `Artisanal Hero Food Photography`,
        prompt_text: `Commercial hero food photography of freshly baked ${topic} for ${businessName}, warm golden hour side lighting, dewy rustic marble and reclaimed wood tabletop, flour dust particles in light beam, shallow depth of field, Hasselblad 8k detail.`,
        description: `Mouthwatering commercial visual ready for Instagram feeds, menus, and promo banners.`,
        aspect_ratio: "1:1",
      };

    default:
      return {
        title: `Hero Commercial Brand Showcase`,
        prompt_text: `High-end commercial hero studio photography for ${businessName} showcasing ${topic}, soft cinematic dual rim lighting, polished reflective acrylic pedestal, minimalist modern aesthetic, subtle floating particle bokeh, 8k studio photo.`,
        description: `High-resolution studio visual ready for Instagram, Facebook, and Web banners.`,
        aspect_ratio: "1:1",
      };
  }
}

function generateTailoredMarketingFallback(input: GenerationInput): GenerationOutput {
  const name = input.businessName || "Your Business";
  const desc = input.description || "Premium quality and craftsmanship";
  const industry = input.industry || "General Business";
  const topic = input.topic || "Behind the Scenes & Quality";
  const tone = input.tone || "Authentic, high-energy";
  const duration = input.durationSeconds || 30;
  const colors = input.colorPalette && input.colorPalette.length > 0 ? input.colorPalette : ["#38BDF8", "#FB923C", "#34D399"];

  const reel1 = generateSingleItem("reel", name, topic, industry, tone, duration);
  const short1 = generateSingleItem("short", name, topic, industry, tone, 15);
  const img1 = generateSingleItem("image", name, topic, industry, tone);

  return {
    reel_prompts: [
      {
        id: "reel_1",
        prompt_text: reel1.prompt_text,
        title: reel1.title,
        description: reel1.description,
        estimated_duration_seconds: duration,
        tone: tone,
      },
      {
        id: "reel_2",
        prompt_text: `🎣 Hook (0-3s): "3 things nobody tells you about choosing the right ${topic}."\n\n🎬 Visual Storyboard:\n• [0:03-0:10] Founder breaking down common misconceptions with split-screen red vs green comparisons.\n• [0:10-0:20] Live demonstration of ${name}'s streamlined methodology.\n• [0:20-0:28] Client satisfaction recap.\n• [0:28-0:30] 🚀 CTA: "Save this reel for later and check our bio for full details!"`,
        title: `3 Things You Need To Know About ${name}`,
        description: `Insider breakdown from ${name}. Save this reel for later! 📌 #${industry.replace(/\s+/g, '')} #ProTips`,
        estimated_duration_seconds: Math.min(duration, 45),
        tone: "Educational & Engaging",
      },
      {
        id: "reel_3",
        prompt_text: `🎣 Hook (0-3s): "A day behind the scenes at ${name}."\n\n🎬 Visual Storyboard:\n• [0:03-0:12] Cinematic time-lapse of morning workflow, creative team in action, and precision tools aligned.\n• [0:12-0:22] Client project reveal with smooth transitions and upbeat background beat.\n• [0:22-0:30] 🚀 CTA: "DM us today to start your project!"`,
        title: `Behind The Scenes at ${name}`,
        description: `Obsessed with the details so you don't have to be ✨ Follow ${name} for more! 👋 #${name.replace(/\s+/g, '')} #DayInTheLife`,
        estimated_duration_seconds: duration,
        tone: "Warm, Authentic & Inspiring",
      },
    ],
    shorts_prompts: [
      {
        id: "short_1",
        prompt_text: short1.prompt_text,
        title: short1.title,
        description: short1.description,
        estimated_duration_seconds: 15,
        tone: "Fast-Paced & Punchy",
      },
      {
        id: "short_2",
        prompt_text: `⚡ Beat 1 (0-3s): "Did you know this about ${industry}?"\n⚡ Beat 2 (3-8s): Graphic overlay showing shocking industry statistic.\n⚡ Beat 3 (8-13s): How ${name} solves it effortlessly with ${topic}.\n⚡ Beat 4 (13-15s): "Subscribe for daily industry tips!"`,
        title: `The 1 Industry Myth You Must Stop Believing`,
        description: `The truth about ${industry} nobody talks about. Subscribe for more! 💡 #Shorts #${name.replace(/\s+/g, '')}`,
        estimated_duration_seconds: 15,
        tone: "Provocative & Educational",
      },
      {
        id: "short_3",
        prompt_text: `⚡ Beat 1 (0-2s): "Client asked us: Can you handle this challenging request?"\n⚡ Beat 2 (2-7s): Action sequence taking on the difficult problem.\n⚡ Beat 3 (7-12s): The stunning finished reveal.\n⚡ Beat 4 (12-15s): Customer 5-star reaction.`,
        title: `When a Client Asks for the Impossible...`,
        description: `Challenge accepted! Here is how we delivered for our client at ${name}. 🔥 #ChallengeAccepted #Shorts`,
        estimated_duration_seconds: 15,
        tone: "Inspiring & Punchy",
      },
    ],
    image_prompts: [
      {
        id: "img_1",
        prompt_text: img1.prompt_text,
        title: img1.title,
        description: img1.description,
        aspect_ratio: "1:1",
        color_palette: colors,
      },
      {
        id: "img_2",
        prompt_text: `Cinematic vertical portrait of team member at work for ${name}, warm atmospheric lighting, subtle depth of field, highly detailed, photorealistic 8k, color tones: ${colors.join(', ')}.`,
        title: `Craft in Motion`,
        description: `Vertical format optimized for Instagram Stories, TikTok cover, or Pinterest pin.`,
        aspect_ratio: "9:16",
        color_palette: colors,
      },
      {
        id: "img_3",
        prompt_text: `Minimalist modern flat-lay composition showcasing ${name} essentials on polished concrete and warm surface, aesthetic organic props, clean typography space, soft ambient natural lighting.`,
        title: `Lifestyle Flat-Lay Essentials`,
        description: `Versatile 4:5 portrait ratio designed for high carousel engagement and saved posts.`,
        aspect_ratio: "4:5",
        color_palette: colors,
      },
      {
        id: "img_4",
        prompt_text: `Widescreen cinematic lifestyle scene capturing happy clients interacting with ${name}, modern setting, natural golden rim lighting, sleek color grading matching ${colors.join(', ')}.`,
        title: `Cinematic Client Connection`,
        description: `Wide 16:9 format ideal for website hero banners, YouTube thumbnails, and LinkedIn posts.`,
        aspect_ratio: "16:9",
        color_palette: colors,
      },
    ],
    video_status_note: "Video rendering is coming soon — these prompts are ready to use with any video tool.",
  };
}
