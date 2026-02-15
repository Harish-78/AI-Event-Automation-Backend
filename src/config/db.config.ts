import pkg from "pg";
import { logger } from "../logger/logger";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pkg;

if (!process.env.DATABASE_URL) {
  logger.error("DATABASE_URL environment variable is missing");
  process.exit(1);
}

const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: {
    rejectUnauthorized: false, // Required for Supabase/Neon/etc.
  },
};

const pool = new Pool(poolConfig);

pool.on("connect", () => {
  logger.info("Connected to the database");
});

pool.on("error", (err: Error) => {
  logger.error(err, "Unexpected error on idle client");
  process.exit(-1);
});

export default pool;
