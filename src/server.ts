import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { logger } from "./logger/logger";
import { connectRabbitMQ } from "./services/rabbitmq.service";
import { startCampaignWorker } from "./workers/campaign.worker";

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

const server = app.listen(PORT, async () => {
  logger.info(`Server running on port ${PORT}`);
  try {
    await connectRabbitMQ();
    startCampaignWorker();
  } catch (err) {
    logger.error({ err }, "Failed to initialize RabbitMQ or CampaignWorker");
    // In production, we might want to retry rather than just log
  }
});

server.on("error", (err) => {
  logger.error({ err }, "Server error");
});
