import pool from "../config/db.config";
import { logger } from "../logger/logger";

/**
 * Migration script:  Adds new columns/tables for invite tokens, event registrations,
 * and college_id on users. Safe to run multiple times (idempotent).
 */
async function migrate() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Add college_id column to users if it doesn't exist
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'users' AND column_name = 'college_id'
        ) THEN
          ALTER TABLE users ADD COLUMN college_id UUID REFERENCES colleges(id) ON DELETE SET NULL;
        END IF;
      END
      $$;
    `);
    logger.info("✓ users.college_id column ensured");

    // 2. Create invite_tokens table
    await client.query(`
      CREATE TABLE IF NOT EXISTS invite_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        token VARCHAR(255) NOT NULL UNIQUE,
        role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'superadmin')),
        college_id UUID REFERENCES colleges(id) ON DELETE CASCADE,
        created_by UUID NOT NULL REFERENCES users(id),
        expires_at TIMESTAMPTZ NOT NULL,
        used_at TIMESTAMPTZ,
        used_by UUID REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_invite_tokens_token ON invite_tokens(token);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_invite_tokens_created_by ON invite_tokens(created_by);`);
    logger.info("✓ invite_tokens table ensured");

    // 3. Create event_registrations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS event_registrations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(50) DEFAULT 'registered' CHECK (status IN ('registered', 'cancelled', 'attended')),
        registered_at TIMESTAMPTZ DEFAULT NOW(),
        cancelled_at TIMESTAMPTZ,
        UNIQUE(event_id, user_id)
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON event_registrations(event_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id ON event_registrations(user_id);`);
    logger.info("✓ event_registrations table ensured");

    await client.query("COMMIT");
    logger.info("Migration completed successfully!");
    process.exit(0);
  } catch (err) {
    await client.query("ROLLBACK");
    logger.error({ err }, "Migration failed");
    process.exit(1);
  } finally {
    client.release();
  }
}

migrate();
