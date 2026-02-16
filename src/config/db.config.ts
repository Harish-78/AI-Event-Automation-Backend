import postgres from "postgres";
import { logger } from "../logger/logger";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.DATABASE_URL) {
  logger.error("DATABASE_URL environment variable is missing");
}

const sql = postgres(process.env.DATABASE_URL!, {
  ssl: {
    rejectUnauthorized: false, // Required for Supabase/Neon/etc.
  },
  max: 1, // Limiting for serverless/Supabase free tier compatibility
  onnotice: (notice) => logger.info({ notice }, "Database notice"),
});

logger.info("Database client initialized with postgres.js");

export default sql;
