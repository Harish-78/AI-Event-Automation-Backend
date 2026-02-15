import fs from "fs";
import path from "path";
import pool from "../config/db.config";
import { logger } from "../logger/logger";

const schemaPath = path.join(__dirname, "../db/schema.sql");
const sql = fs.readFileSync(schemaPath, "utf-8");

async function run() {
  try {
    await pool.query(sql);
    logger.info("Database schema applied successfully");
    process.exit(0);
  } catch (err) {
    logger.error({ err }, "Failed to apply schema");
    process.exit(1);
  }
}

run();
