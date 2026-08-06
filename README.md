# AdReel — AI Marketing Content Engine for Small Businesses

AdReel is a full-stack, free-tier marketing generation platform that turns business descriptions and content filters into production-ready **Instagram Reel scripts**, **YouTube Shorts scene breakdowns**, and **text-to-image studio visual prompts** with generated visuals.

---

## ⚡ Zero Paid APIs — 100% Free Architecture

| Component | Technology | Free Tier Details |
| :--- | :--- | :--- |
| **Frontend & Backend** | Next.js 14+ (App Router), TypeScript, Tailwind CSS | Self-hosted or Vercel Free Tier |
| **Database** | NeonDB (PostgreSQL) + `pgvector` extension | Free Tier Serverless Postgres |
| **ORM** | Drizzle ORM | Type-safe PostgreSQL & Vector queries |
| **Authentication** | NextAuth.js | Self-managed credentials & instant demo login |
| **Orchestration** | n8n | Self-hosted via Docker |
| **LLM Engine** | Google Gemini API (`gemini-1.5-flash`) | Free Tier API key / Dynamic Synthesizer |
| **Embeddings (384-d)** | `sentence-transformers/all-MiniLM-L6-v2` | Local Python microservice / Hugging Face free inference |
| **Image Generation** | Free Diffusion / FLUX Pipeline | Local FastAPI microservice & Pollinations open models |

> [!NOTE]
> **Video Generation Scope**: Video rendering is scoped as "coming soon" in this version — the app outputs structured, video-ready prompts/scripts that the owner can use with any tool (CapCut, Premiere Pro, Runway, Pika).

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file (or use existing):
```env
DATABASE_URL="postgresql://neondb_owner:npg_v3Nsir8bypgF@ep-soft-leaf-azvxufgq-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
NEXTAUTH_SECRET="adreel_super_secret_session_key_2026_marketing_ai"
NEXTAUTH_URL="http://localhost:3000"
GEMINI_API_KEY="" # Optional free tier key
```

### 3. Initialize & Seed NeonDB Database
```bash
# 1. Enable pgvector & create tables
npx tsx scripts/init-db.ts

# 2. Seed 30+ style library marketing blueprints with 384-dim embeddings
npm run db:seed
```

### 4. Start Next.js Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🐳 Running Orchestration Microservice & n8n via Docker

```bash
docker-compose up -d
```
- **FastAPI AI Microservice**: `http://localhost:8000` (`/docs` for Swagger UI)
- **n8n Webhook & Workflow Engine**: `http://localhost:5678`
- **Workflow Files**: Import `n8n/adreel-generation-workflow.json` and `n8n/adreel-weekly-rag-promotion.json` into n8n.

---

## 🧠 Continuous Learning RAG Loop
1. When business owners click **"Keep"** on generated prompts, the prompts are tagged (`is_kept = true`).
2. The scheduled RAG promotion pipeline (`POST /api/rag/promote` or n8n weekly schedule) scans high-performing kept prompts, vectorizes them, and inserts them into `style_library` with `source = 'learned'`.
3. Future generation requests automatically retrieve these learned high-performing examples as RAG context, improving generation quality over time!
