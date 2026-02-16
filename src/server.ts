import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { logger } from "./logger/logger";

const PORT = Number(process.env.PORT) || 5001;

process.on("uncaughtException", (err) => {
  logger.error({ err }, "Uncaught Exception");
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled Rejection");
  process.exit(1);
});

process.on("exit", (code) => {
  logger.info(`Process exiting with code ${code}`);
});

const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

server.on("error", (err) => {
  logger.error({ err }, "Server error");
});
