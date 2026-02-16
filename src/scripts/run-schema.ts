import fs from "fs";
import path from "path";
import sql from "../config/db.config";
import { logger } from "../logger/logger";

const schemaPath = path.join(__dirname, "../db/schema.sql");
const schemaSql = fs.readFileSync(schemaPath, "utf-8");

async function run() {
  try {
    // postgres.js can execute multiple statements in one call if configured correctly,
    // but for raw schema SQL it's usually safest to just pass it.
    await sql.unsafe(schemaSql);
    logger.info("Database schema applied successfully");
    process.exit(0);
  } catch (err) {
    logger.error({ err }, "Failed to apply schema");
    process.exit(1);
  }
}

run();
