import fs from "fs";
import path from "path";
import sql from "../config/db.config";
import { logger } from "../logger/logger";

async function runMigration(fileName: string) {
  const filePath = path.join(__dirname, "../db/migrations", fileName);
  if (!fs.existsSync(filePath)) {
    logger.error(`Migration file not found: ${filePath}`);
    process.exit(1);
  }

  const migrationSql = fs.readFileSync(filePath, "utf-8");

  try {
    await sql.unsafe(migrationSql);
    logger.info(`Migration ${fileName} applied successfully`);
    process.exit(0);
  } catch (err) {
    logger.error({ err }, `Failed to apply migration ${fileName}`);
    process.exit(1);
  }
}

const fileName = process.argv[2];
if (!fileName) {
  console.error("Please provide a migration filename");
  process.exit(1);
}

runMigration(fileName);
