import postgres from "postgres";
import { logger } from "../logger/logger";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.DATABASE_URL) {
  logger.error("DATABASE_URL environment variable is missing");
}


const isProduction = process.env.NODE_ENV === "production"

const sql = postgres(process.env.DATABASE_URL!, {
  ssl: isProduction
    ? { rejectUnauthorized: false }
    : false,
  max: 10,
  idle_timeout: 30,
  connect_timeout: 10,
  onnotice: (notice) => logger.info({ notice }, "Database notice"),
})

logger.info("Database client initialized with postgres.js");

export default sql;
