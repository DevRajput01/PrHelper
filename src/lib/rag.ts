import { sql } from "../db";
import { getEmbedding } from "./embeddings";

export interface RagContextItem {
  id: string;
  content: string;
  industry: string | null;
  similarity: number;
}

/**
 * Queries pgvector in NeonDB for the most similar entries in style_library
 */
export async function queryStyleLibrary(
  queryText: string,
  limit: number = 5
): Promise<RagContextItem[]> {
  try {
    const embedding = await getEmbedding(queryText);
    const vectorStr = `[${embedding.join(",")}]`;

    // Cosine distance operator in pgvector is <=>
    // 1 - cosine_distance = cosine_similarity
    const rows = await sql`
      SELECT 
        id, 
        content, 
        industry, 
        1 - (embedding <=> ${vectorStr}::vector) as similarity
      FROM style_library
      ORDER BY embedding <=> ${vectorStr}::vector ASC
      LIMIT ${limit};
    `;

    return rows.map((r) => ({
      id: r.id,
      content: r.content,
      industry: r.industry,
      similarity: Number(r.similarity),
    }));
  } catch (error) {
    console.error("Error querying style library with pgvector:", error);
    // Return empty array on failure so generation can still proceed
    return [];
  }
}
