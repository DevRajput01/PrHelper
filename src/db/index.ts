import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import dotenv from "dotenv";

if (!process.env.DATABASE_URL) {
  dotenv.config({ path: ".env.local" });
  dotenv.config();
}

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_v3Nsir8bypgF@ep-soft-leaf-azvxufgq-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

// Disable prefetch as it is not supported for "Transaction" pool mode
export const sql = postgres(connectionString, { prepare: false });
export const db = drizzle(sql, { schema });
export { schema };
