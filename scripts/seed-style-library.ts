import postgres from "postgres";
import * as dotenv from "dotenv";
import { getEmbedding } from "../src/lib/embeddings";

dotenv.config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is required in .env.local");
  process.exit(1);
}

const sql = postgres(connectionString, { prepare: false });

const seedExamples = [
  // 1. Artisan Bakery
  {
    industry: "Food & Beverage",
    content: `Reel Hook: "Hear that sound? That's 36 hours of natural fermentation speaking." Visual: Macro close-up knife slicing through a blistered sourdough crust with deep ear, steam gently escaping in morning sunlight. Voiceover explains the wild yeast difference. CTA: "Fresh out of the hearth daily at 7 AM. Save this for your morning coffee run." Tone: Warm, artisanal, sensory-rich.`,
  },
  {
    industry: "Food & Beverage",
    content: `Shorts Breakdown: Beat 1 (0-3s): Baker tossing flour over dough ball with slow-mo dust cloud. Beat 2 (3-8s): 3 rapid cuts of kneading, folding, and basket proofing. Beat 3 (8-15s): Oven door opening to glowing golden croissants. Beat 4 (15-20s): Biting into flaky layers with ASMR audio. Title: "Behind the 4 AM Pastry Magic". Tone: Energetic, authentic.`,
  },
  {
    industry: "Food & Beverage",
    content: `Image Prompt: Overhead flat-lay of rustic wooden table with freshly baked artisan sourdough loaf, golden croissants, pat of churned sea-salt butter, ceramic mug of oat milk latte. Soft morning golden hour lighting, cinematic bokeh, earthy terracotta and sage green color palette, 4:5 aspect ratio.`,
  },

  // 2. Specialty Coffee Roaster
  {
    industry: "Food & Beverage",
    content: `Reel Hook: "Stop drinking burnt supermarket beans. Here's what real coffee tastes like." Visual: Single-origin Ethiopian beans tumbling from cast-iron roaster drum, followed by precise 1:16 pour-over bloom expanding. Captions highlighting notes of bergamot and blueberry. Tone: Educational, passionate, sophisticated.`,
  },
  {
    industry: "Food & Beverage",
    content: `Shorts Breakdown: Beat 1 (0-2s): Coffee cherries on tree branch. Beat 2 (2-6s): Hand-sorting green beans. Beat 3 (6-12s): Roasting temperature curve graph overlay on glowing roasting chamber. Beat 4 (12-18s): First sip reaction with huge smile. Title: "From Farm to Cup: The Ethiopia Yirgacheffe Journey". Tone: Inspiring.`,
  },

  // 3. Fitness & HIIT Gym
  {
    industry: "Fitness & Wellness",
    content: `Reel Hook: "You don't need 2 hours in the gym. You just need 28 focused minutes." Visual: Fast-paced montage of kettlebell swings, battle ropes, and sled pushes under moody gym LED lighting with sweat dripping. High-bpm sync. CTA: "Claim your 3-day free trial class today." Tone: Motivating, high-energy, empowering.`,
  },
  {
    industry: "Fitness & Wellness",
    content: `Shorts Breakdown: Beat 1 (0-3s): Trainer clapping chalk hands. Beat 2 (3-7s): Form check on deadlift - 'Do this, not that' red/green checkmark overlays. Beat 3 (7-12s): Group high-fives at finish bell. Beat 4 (12-15s): "Join the 6 AM squad." Title: "Fix Your Deadlift in 15 Seconds". Tone: Direct, punchy.`,
  },
  {
    industry: "Fitness & Wellness",
    content: `Image Prompt: Dramatic low-angle photo of an athletic female athlete holding kettlebells in a sleek modern boutique gym, atmospheric rim lighting with cyan and neon violet glow, chalk dust in air, sharp focus, hyper-realistic, 9:16 aspect ratio.`,
  },

  // 4. SaaS & AI Productivity
  {
    industry: "Technology & SaaS",
    content: `Reel Hook: "I used to spend 14 hours every Friday doing client reports until I automated this." Visual: Screen recording contrasting cluttered chaotic spreadsheets with red errors vs clean instant automated AdReel dashboard generating full campaigns in 10 seconds. Voiceover: "Work smarter, go home on time." Tone: Relatable, innovative, problem-solving.`,
  },
  {
    industry: "Technology & SaaS",
    content: `Shorts Breakdown: Beat 1 (0-3s): Frustrated entrepreneur holding head at desk. Beat 2 (3-8s): 3 browser tabs closing with satisfying sound effect. Beat 3 (8-14s): AI generating 10 marketing hooks simultaneously. Beat 4 (14-18s): Smiling founder walking outside in park. Title: "How to Reclaim 10 Hours Every Week". Tone: Empowering, concise.`,
  },
  {
    industry: "Technology & SaaS",
    content: `Image Prompt: Sleek futuristic 3D glassmorphic dashboard interface floating in dark tech environment, glowing purple and electric blue neon gradients, smooth holographic charts, clean UI design, cinematic 16:9 aspect ratio.`,
  },

  // 5. Boutique Real Estate
  {
    industry: "Real Estate",
    content: `Reel Hook: "Step inside the most tranquil master bathroom in Pacific Heights." Visual: Ultra-smooth gimbal glide through floor-to-ceiling glass doors into a freestanding Japanese soaking tub with panoramic forest views, jazz lo-fi audio. Key property stats overlaid cleanly. Tone: Luxurious, serene, aspirational.`,
  },
  {
    industry: "Real Estate",
    content: `Shorts Breakdown: Beat 1 (0-3s): Exterior drone shot descending toward mid-century modern home. Beat 2 (3-7s): Chef's kitchen with waterfall marble island. Beat 3 (7-12s): Sunset infinity pool transition. Beat 4 (12-15s): Listing price and private tour booking link. Title: "Touring a $3.2M Architectural Masterpiece". Tone: High-end luxury.`,
  },
  {
    industry: "Real Estate",
    content: `Image Prompt: Architectural photography of a modern luxury living room with floor-to-ceiling windows overlooking coastal sunset, warm minimalist interior design, white bouclé sofa, travertine coffee table, warm ambient evening light, 1:1 square aspect ratio.`,
  },

  // 6. Sustainable Fashion Brand
  {
    industry: "Fashion & Retail",
    content: `Reel Hook: "1 dress, 5 completely different occasions." Visual: Model doing smooth spin transitions styling a French flax linen shirt dress for brunch, office, date night, beach stroll, and evening cocktail party. Text callouts on ethical organic fabric certifications. Tone: Chic, effortless, eco-conscious.`,
  },
  {
    industry: "Fashion & Retail",
    content: `Shorts Breakdown: Beat 1 (0-3s): Close-up of natural flax fibers and botanical dyeing vat. Beat 2 (3-8s): Artisan hand-stitching collar details. Beat 3 (8-13s): Outfit reveal with natural outdoor breeze. Beat 4 (13-16s): "Plastic-free packaging included." Title: "The Story Behind Your Favorite Linen Shirt". Tone: Transparent, elegant.`,
  },

  // 7. Modern Dental / Orthodontics
  {
    industry: "Healthcare & Dental",
    content: `Reel Hook: "Think clear aligners take years? Look at what 6 months did for Sarah." Visual: Split screen before-and-after 3D smile scan morphing smoothly into real-life glowing smile at her graduation. Patient testimonial snippet with genuine emotion. Tone: Trustworthy, transformative, warm.`,
  },
  {
    industry: "Healthcare & Dental",
    content: `Shorts Breakdown: Beat 1 (0-2s): "3 things your dentist wishes you knew about whitening." Beat 2 (2-6s): Point 1 - Avoid lemon juice hacks. Beat 3 (6-10s): Point 2 - Timing after acidic drinks. Beat 4 (10-15s): Point 3 - Professional gentle remineralization. Title: "Dentist Reacts: Viral Whitening Trends". Tone: Friendly, expert.`,
  },

  // 8. Pet Grooming & Spa
  {
    industry: "Pet Care",
    content: `Reel Hook: "From muddy monster to fluffy cloud in 60 seconds." Visual: Hilarious scruffy golden doodle getting blueberry bubble bath facial, warm blowout fluffing fur into giant teddy bear look, finishing with a bowtie. Fun upbeat acoustic music. Tone: Joyful, adorable, heartwarming.`,
  },
  {
    industry: "Pet Care",
    content: `Shorts Breakdown: Beat 1 (0-3s): Nervous dog walking in salon. Beat 2 (3-7s): Gentle treat feeding and paw massage. Beat 3 (7-11s): Perfect scissor work around face. Beat 4 (11-15s): Tail-wagging reunion with proud owner. Title: "Puppy's First Grooming Spa Day!". Tone: Reassuring, cute.`,
  },

  // 9. Auto Detailing & Ceramic Coating
  {
    industry: "Automotive",
    content: `Reel Hook: "Watch what happens when you pour muddy water on a fresh 9H ceramic coating." Visual: Super satisfying slow-motion water beading and sheeting instantly off a pristine midnight black Porsche hood without leaving a single drop or streak. Tone: Satisfying, premium, technical mastery.`,
  },
  {
    industry: "Automotive",
    content: `Shorts Breakdown: Beat 1 (0-3s): Disgusting dirty car interior macro shot. Beat 2 (3-8s): Steam cleaning extracting black grime from leather. Beat 3 (8-13s): Foam cannon blast covering exterior in thick snow foam. Beat 4 (13-17s): Flawless mirror finish reveal. Title: "Ultimate ASMR Deep Detailing". Tone: Hypnotic, crisp.`,
  },

  // 10. Hair Salon & Balayage Specialist
  {
    industry: "Beauty & Personal Care",
    content: `Reel Hook: "She said her previous stylist turned her hair brassy orange. Here's our 4-hour rescue." Visual: Step-by-step foil placement, custom ash toner bowl mixing, root shadow smudge, and glamorous bouncy blowout reveal showing dimensional vanilla blonde. Tone: Expert, dramatic, uplifting.`,
  },
  {
    industry: "Beauty & Personal Care",
    content: `Shorts Breakdown: Beat 1 (0-2s): Client consultation in chair. Beat 2 (2-6s): Precision slicing with color brush. Beat 3 (6-11s): Basin wash and Olaplex treatment. Beat 4 (11-15s): 360 chair spin showing glossy silk curls. Title: "From Brassy to Butter Blonde". Tone: Glamorous.`,
  },

  // 11. Local Handmade Jewelry Studio
  {
    industry: "Handmade & Crafts",
    content: `Reel Hook: "Turning an ugly lump of raw silver into an heirloom engagement ring." Visual: Torch flame melting metal at 1600 degrees, hammering texture on steel mandrel, bezel setting a Montana sapphire, buffing to mirror shine. Sound of hammer and torch hiss. Tone: Mesmerizing, authentic craftsmanship.`,
  },
  {
    industry: "Handmade & Crafts",
    content: `Shorts Breakdown: Beat 1 (0-3s): Rough uncut gemstone on charcoal block. Beat 2 (3-7s): Jeweler's loupe inspection. Beat 3 (7-11s): Hand-engraving secret message inside ring band. Beat 4 (11-15s): Custom velvet ring box unboxing. Title: "How We Hand-Forge a Custom Sapphire Ring". Tone: Intimate, romantic.`,
  },

  // 12. Digital Marketing & Content Consulting
  {
    industry: "Marketing & Consulting",
    content: `Reel Hook: "Stop posting 'Happy Monday' graphics. Here's the 3-step content framework that booked us 42 clients." Visual: Whiteboard breakdown of Hook -> Retain -> Convert architecture with clear visual examples for service businesses. Tone: High-value, no-fluff, authoritative.`,
  },
  {
    industry: "Marketing & Consulting",
    content: `Shorts Breakdown: Beat 1 (0-3s): "The #1 reason your Reels get stuck at 200 views." Beat 2 (3-7s): The 3-second visual hook mistake. Beat 3 (7-11s): How to re-frame your headline as a question. Beat 4 (11-15s): Drop your industry below for a free hook. Title: "Fix Your 200-View Jail". Tone: Direct, tactical.`,
  },

  // 13. Eco-Cleaning & House Organizing
  {
    industry: "Home Services",
    content: `Reel Hook: "This pantry had 4 years of expired cans. Watch 3 hours of chaos turn into pure container bliss in 20 seconds." Visual: High-speed time-lapse sorting items into clear acrylic bins with custom minimalist labels, turntable spice racks, matching woven baskets. Tone: Calming, hyper-organized, satisfying.`,
  },

  // 14. Plant Nursery & Botanical Shop
  {
    industry: "Home & Garden",
    content: `Reel Hook: "Don't throw away that yellowing Monstera! It's begging for this one 10-second fix." Visual: Plant doctor gently lifting root ball to demonstrate aerated soil mix, pruning dead nodes with sterilized shears, and adding moss pole. Tone: Gentle, educational, lush green aesthetic.`,
  },

  // 15. Law Firm & Estate Planning
  {
    industry: "Professional Services",
    content: `Reel Hook: "If you own a small business and don't have this one document, the state decides who gets your company." Visual: Friendly attorney at modern desk breaking down operating agreements vs power of attorney with clean animated bullet points. Tone: Approachable, sobering, trustworthy.`,
  },
];

async function seedStyleLibrary() {
  console.log(`Starting style library seeding with ${seedExamples.length} high-quality marketing examples...`);

  try {
    // Clear existing seed entries to avoid duplicates on re-run
    await sql`DELETE FROM style_library WHERE source = 'seed';`;
    console.log("Cleaned existing seed entries.");

    for (let i = 0; i < seedExamples.length; i++) {
      const item = seedExamples[i];
      console.log(`[${i + 1}/${seedExamples.length}] Embedding example for ${item.industry}...`);

      const embedding = await getEmbedding(item.content);
      const vectorStr = `[${embedding.join(",")}]`;

      await sql`
        INSERT INTO style_library (content, embedding, source, industry)
        VALUES (${item.content}, ${vectorStr}::vector, 'seed', ${item.industry});
      `;
    }

    console.log(`🎉 Successfully seeded ${seedExamples.length} style library entries with 384-dimensional vector embeddings!`);
  } catch (error) {
    console.error("Error seeding style library:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

seedStyleLibrary();
