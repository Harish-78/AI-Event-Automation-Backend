import pool from "../config/db.config";
import bcrypt from "bcryptjs";
import { logger } from "../logger/logger";

async function seedSuperAdmin() {
  const email = process.argv[2] || "superadmin@eventautomation.com";
  const password = process.argv[3] || "SuperAdmin@123";
  const name = process.argv[4] || "Super Admin";

  try {
    // Check if superadmin already exists
    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email.toLowerCase()]
    );

    if (existing.rows.length > 0) {
      // Promote existing user to superadmin
      await pool.query(
        "UPDATE users SET role = 'superadmin', email_verified_at = COALESCE(email_verified_at, NOW()), updated_at = NOW() WHERE email = $1",
        [email.toLowerCase()]
      );
      console.log(`\n✅ Existing user ${email} promoted to superadmin!\n`);
      await pool.end();
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name, email_verified_at, role)
       VALUES ($1, $2, $3, NOW(), 'superadmin')
       RETURNING id, email, name, role`,
      [email.toLowerCase(), passwordHash, name]
    );

    const user = result.rows[0];
    console.log("\n✅ SuperAdmin created successfully!");
    console.log("──────────────────────────────────");
    console.log(`  ID:       ${user.id}`);
    console.log(`  Email:    ${user.email}`);
    console.log(`  Name:     ${user.name}`);
    console.log(`  Password: ${password}`);
    console.log(`  Role:     superadmin`);
    console.log("──────────────────────────────────");
    console.log("\nYou can now login with these credentials.\n");
  } catch (err) {
    logger.error({ err }, "Failed to seed superadmin");
    console.error("Failed to seed superadmin:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedSuperAdmin();
