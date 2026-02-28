import postgres from "postgres";
import { logger } from "../logger/logger";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.DATABASE_URL) {
  logger.error("DATABASE_URL environment variable is missing");
}

const sql = postgres(process.env.DATABASE_URL!, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 30,
  onnotice: (notice) => logger.info({ notice }, "Database notice"),
  ssl: "require", // Force SSL for Supabase connection
  prepare: false, // Disable prepared statements for PgBouncer compatibility (port 6543)
});

logger.info("Database client initialized with postgres.js");

export default sql;
