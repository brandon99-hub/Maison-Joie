const { neon } = require("@neondatabase/serverless");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

// Load DATABASE_URL from .env in project root
function getDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const envPath = path.resolve(__dirname, "..", "..", ".env");
  if (!fs.existsSync(envPath)) {
    console.error("❌ .env file not found at:", envPath);
    process.exit(1);
  }
  const envContent = fs.readFileSync(envPath, "utf8");
  const match = envContent.match(/DATABASE_URL=(.+)/);
  if (!match) {
    console.error("❌ DATABASE_URL not found in .env");
    process.exit(1);
  }
  let url = match[1].trim();
  if ((url.startsWith('"') && url.endsWith('"')) || (url.startsWith("'") && url.endsWith("'"))) {
    url = url.slice(1, -1);
  }
  return url;
}

async function seedAdmin() {
  console.log("=========================================");
  console.log("    Maison Joie - Seed Admin Account      ");
  console.log("=========================================\n");

  const databaseUrl = getDatabaseUrl();
  const sql = neon(databaseUrl);

  const targetUsername = "Administrator";
  const targetEmail = "admin@maisonjoie.co.ke";
  const defaultFallbackPassword = "Temppassword-123";

  try {
    // 1. Look for existing admin accounts to retain the seeded password hash
    const existingAdmins = await sql`
      SELECT id, username, email, password_hash 
      FROM admin_users 
      ORDER BY id ASC
    `;

    let passwordHashToUse = "";
    let retainedFromUser = "";

    if (existingAdmins.length > 0) {
      // Prefer password_hash from Administrator if present, else from 'admin' or first available
      const adminMatch = existingAdmins.find(
        (u) => u.username.toLowerCase() === targetUsername.toLowerCase()
      ) || existingAdmins.find(
        (u) => u.username.toLowerCase() === "admin"
      ) || existingAdmins[0];

      if (adminMatch && adminMatch.password_hash) {
        passwordHashToUse = adminMatch.password_hash;
        retainedFromUser = adminMatch.username;
        console.log(`ℹ️ Retained existing password hash from account: '${retainedFromUser}'`);
      }
    }

    if (!passwordHashToUse) {
      console.log(`ℹ️ No prior password hash found. Hashing default: '${defaultFallbackPassword}'...`);
      passwordHashToUse = await bcrypt.hash(defaultFallbackPassword, 10);
    }

    // 2. Upsert the Administrator account
    await sql`
      INSERT INTO admin_users (username, email, password_hash)
      VALUES (${targetUsername}, ${targetEmail}, ${passwordHashToUse})
      ON CONFLICT (username) DO UPDATE
        SET email = EXCLUDED.email,
            password_hash = EXCLUDED.password_hash
    `;

    // 3. Verify
    const currentAdmins = await sql`
      SELECT id, username, email, created_at 
      FROM admin_users
    `;

    console.log("\n=========================================");
    console.log("   Admin Account Seeded Successfully!    ");
    console.log("=========================================");
    console.log(`Username : ${targetUsername}`);
    console.log(`Email    : ${targetEmail}`);
    console.log(`Password : ${retainedFromUser ? `(Retained from '${retainedFromUser}' account)` : defaultFallbackPassword}`);
    console.log("\nAll Admin Users in Database:");
    console.table(currentAdmins);
    console.log("\n✅ Ready for login at /admin/login\n");
  } catch (error) {
    console.error("\n❌ Error seeding admin account:", error);
    process.exit(1);
  }
}

seedAdmin();
