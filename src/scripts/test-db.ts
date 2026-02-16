import dotenv from "dotenv";
dotenv.config();
import sql from "../config/db.config";
import { logger } from "../logger/logger";

async function test() {
  try {
    logger.info("Testing database connection...");
    const [row] = await sql`SELECT NOW() AS now`;
    logger.info({ now: row?.now }, "Connection successful!");
    process.exit(0);
  } catch (err) {
    logger.error({ err }, "Connection failed!");
    process.exit(1);
  }
}

test();
