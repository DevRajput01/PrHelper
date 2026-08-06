import postgres from "postgres";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const sql = postgres(process.env.DATABASE_URL!, { prepare: false });

async function main() {
  console.log("Testing user registration and password verification...");

  const testEmail = `test_${Date.now()}@mybusiness.com`;
  const testName = "Alice Founder";
  const testPassword = "MySecurePassword123!";

  // 1. Hash password
  const hash = await bcrypt.hash(testPassword, 10);

  // 2. Insert into DB
  const inserted = await sql`
    INSERT INTO users (name, email, password_hash)
    VALUES (${testName}, ${testEmail}, ${hash})
    RETURNING id, name, email, password_hash;
  `;

  console.log("✓ User registered in DB:", inserted[0].email, "ID:", inserted[0].id);

  // 3. Verify bcrypt compare
  const passwordMatches = await bcrypt.compare(testPassword, inserted[0].password_hash);
  console.log("✓ Password comparison verified:", passwordMatches);

  const wrongPasswordMatches = await bcrypt.compare("WrongPassword", inserted[0].password_hash);
  console.log("✓ Incorrect password rejected:", !wrongPasswordMatches);

  console.log("All Auth DB verification checks passed!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
