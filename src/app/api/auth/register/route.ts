import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql } from "@/db";
import { getUserAvatar } from "@/lib/avatar";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Name, email, and password are all required" },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUsers = await sql`
      SELECT id FROM users WHERE email = ${cleanEmail} LIMIT 1;
    `;

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in instead." },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Assign a permanent unique avatar for this specific user that will never change
    const assignedAvatar = getUserAvatar(cleanEmail);

    // Insert new user with permanent avatar
    const newUsers = await sql`
      INSERT INTO users (name, email, password_hash, image)
      VALUES (${name.trim()}, ${cleanEmail}, ${passwordHash}, ${assignedAvatar})
      RETURNING id, name, email, image, created_at;
    `;

    const user = newUsers[0];

    return NextResponse.json(
      {
        success: true,
        message: "Account registered successfully",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[Register Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to register account" },
      { status: 500 }
    );
  }
}
