import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is required in .env.local");
  process.exit(1);
}

const sql = postgres(connectionString, { prepare: false });

async function initDatabase() {
  console.log("Connecting to NeonDB and initializing database schema...");

  try {
    // 1. Enable pgvector extension
    console.log("Enabling vector extension...");
    await sql`CREATE EXTENSION IF NOT EXISTS vector;`;
    console.log("✓ pgvector extension enabled.");

    // 2. Create tables matching schema
    console.log("Creating tables...");

    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        password_hash TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `;
    console.log("✓ users table ready.");

    await sql`
      CREATE TABLE IF NOT EXISTS businesses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        industry TEXT,
        embedding VECTOR(384),
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `;
    console.log("✓ businesses table ready.");

    await sql`
      CREATE TABLE IF NOT EXISTS content_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
        topic TEXT,
        video_type TEXT,
        duration_seconds INT,
        color_palette TEXT[],
        tone TEXT,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `;
    console.log("✓ content_requests table ready.");

    await sql`
      CREATE TABLE IF NOT EXISTS generated_prompts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        request_id UUID REFERENCES content_requests(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        prompt_text TEXT NOT NULL,
        title TEXT,
        description TEXT,
        estimated_duration_seconds INT,
        tone TEXT,
        aspect_ratio TEXT,
        color_palette TEXT[],
        is_kept BOOLEAN,
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `;
    console.log("✓ generated_prompts table ready.");

    await sql`
      CREATE TABLE IF NOT EXISTS generated_assets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        prompt_id UUID REFERENCES generated_prompts(id) ON DELETE CASCADE,
        asset_type TEXT NOT NULL,
        url TEXT,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `;
    console.log("✓ generated_assets table ready.");

    await sql`
      CREATE TABLE IF NOT EXISTS style_library (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        content TEXT NOT NULL,
        embedding VECTOR(384),
        source TEXT NOT NULL,
        industry TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `;
    console.log("✓ style_library table ready.");

    // Create vector index on style_library for fast similarity search
    await sql`
      CREATE INDEX IF NOT EXISTS style_library_embedding_idx 
      ON style_library 
      USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 10);
    `.catch((err) => {
      // Ivfflat index requires rows or can be created after seeding; ignore if table is empty
      console.log("Note: vector index will be optimized after seeding.");
    });

    console.log("🎉 Database schema initialized successfully!");
  } catch (error) {
    console.error("Error initializing database:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

initDatabase();
