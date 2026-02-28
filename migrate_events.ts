import sql from "./src/config/db.config";

async function migrate() {
  try {
    console.log("Starting migration: Add is_global to events table...");
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS is_global BOOLEAN DEFAULT FALSE`;
    console.log("Migration successful.");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

migrate();
