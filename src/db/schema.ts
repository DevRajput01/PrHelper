import { pgTable, uuid, text, integer, boolean, timestamp, customType } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// Custom vector type for pgvector with 384 dimensions (all-MiniLM-L6-v2)
export const vector384 = customType<{
  data: number[];
  driverData: string;
}>({
  dataType() {
    return "vector(384)";
  },
  toDriver(value: number[]): string {
    return `[${value.join(",")}]`;
  },
  fromDriver(value: string): number[] {
    if (!value) return [];
    if (typeof value === "string") {
      const clean = value.replace(/[\[\]]/g, "");
      return clean ? clean.split(",").map(Number) : [];
    }
    return value;
  },
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  passwordHash: text("password_hash"),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const businesses = pgTable("businesses", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull(),
  industry: text("industry"),
  embedding: vector384("embedding"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const contentRequests = pgTable("content_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").references(() => businesses.id, { onDelete: "cascade" }),
  topic: text("topic"),
  videoType: text("video_type"),
  durationSeconds: integer("duration_seconds"),
  colorPalette: text("color_palette").array(),
  tone: text("tone"),
  status: text("status").default("pending"), // pending | processing | complete | failed
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const generatedPrompts = pgTable("generated_prompts", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestId: uuid("request_id").references(() => contentRequests.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // reel | short | image
  promptText: text("prompt_text").notNull(),
  title: text("title"),
  description: text("description"),
  estimatedDurationSeconds: integer("estimated_duration_seconds"),
  tone: text("tone"),
  aspectRatio: text("aspect_ratio"),
  colorPalette: text("color_palette").array(),
  isKept: boolean("is_kept"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const generatedAssets = pgTable("generated_assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  promptId: uuid("prompt_id").references(() => generatedPrompts.id, { onDelete: "cascade" }),
  assetType: text("asset_type").notNull(), // image | video
  url: text("url"),
  status: text("status").default("pending"), // pending | processing | complete | failed
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const styleLibrary = pgTable("style_library", {
  id: uuid("id").primaryKey().defaultRandom(),
  content: text("content").notNull(),
  embedding: vector384("embedding"),
  source: text("source").notNull(), // seed | learned
  industry: text("industry"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  businesses: many(businesses),
}));

export const businessesRelations = relations(businesses, ({ one, many }) => ({
  user: one(users, {
    fields: [businesses.userId],
    references: [users.id],
  }),
  contentRequests: many(contentRequests),
}));

export const contentRequestsRelations = relations(contentRequests, ({ one, many }) => ({
  business: one(businesses, {
    fields: [contentRequests.businessId],
    references: [businesses.id],
  }),
  generatedPrompts: many(generatedPrompts),
}));

export const generatedPromptsRelations = relations(generatedPrompts, ({ one, many }) => ({
  contentRequest: one(contentRequests, {
    fields: [generatedPrompts.requestId],
    references: [contentRequests.id],
  }),
  assets: many(generatedAssets),
}));

export const generatedAssetsRelations = relations(generatedAssets, ({ one }) => ({
  prompt: one(generatedPrompts, {
    fields: [generatedAssets.promptId],
    references: [generatedPrompts.id],
  }),
}));
