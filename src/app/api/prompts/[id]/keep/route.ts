import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL || "";
const sql = postgres(connectionString, { prepare: false });

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const promptId = params.id;
    const body = await req.json();
    const { isKept } = body;

    if (!promptId) {
      return NextResponse.json({ error: "Missing prompt ID" }, { status: 400 });
    }

    const updated = await sql`
      UPDATE generated_prompts
      SET is_kept = ${isKept === null ? null : Boolean(isKept)}
      WHERE id = ${promptId}
      RETURNING id, is_kept;
    `;

    if (updated.length === 0) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      prompt: updated[0],
    });
  } catch (error: any) {
    console.error("Error updating keep/discard status:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update status" },
      { status: 500 }
    );
  }
}
