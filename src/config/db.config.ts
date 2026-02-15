import pkg from "pg";
import { logger } from "../logger/logger";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined,
  database: process.env.DB_NAME,
});

pool.on("connect", () => {
  logger.info("Connected to the database");
});

pool.on("error", (err: Error) => {
  logger.error(err, "Unexpected error on idle client");
  process.exit(-1);
});

export default pool;
