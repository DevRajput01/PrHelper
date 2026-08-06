import { sql } from "../src/db";
import { getUserAvatar } from "../src/lib/avatar";

async function main() {
  console.log("Checking database users table...");
  try {
    // 1. Ensure image column exists
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS image TEXT;`;
    console.log("✓ Column 'image' ready in users table");

    // 2. Fetch users without an image
    const existingUsers = await sql`SELECT id, name, email, image FROM users;`;
    console.log(`Found ${existingUsers.length} total users.`);

    for (const u of existingUsers) {
      if (!u.image) {
        const assignedAvatar = getUserAvatar(u.email || u.name || u.id);
        await sql`UPDATE users SET image = ${assignedAvatar} WHERE id = ${u.id};`;
        console.log(`✓ Assigned permanent avatar to user ${u.email || u.id}: ${assignedAvatar}`);
      } else {
        console.log(`• User ${u.email} already has permanent avatar: ${u.image}`);
      }
    }

    console.log("Migration complete!");
    process.exit(0);
  } catch (err: any) {
    console.error("Migration error:", err.message);
    process.exit(1);
  }
}

main();
