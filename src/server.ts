import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { logger } from "./logger/logger";
import { initRabbitMQ } from "./config/rabbitmq.config";
import { startMailConsumer } from "./services/mail.consumer";

const PORT = Number(process.env.PORT) || 5001;

async function startServer() {
  try {
    // Initialize RabbitMQ
    await initRabbitMQ();
    // Start Consumer
    await startMailConsumer();

    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });

    server.on("error", (err) => {
      logger.error({ err }, "Server error");
    });
  } catch (error) {
    logger.error({ error }, "Failed to start server due to initialization error");
    process.exit(1);
  }
}

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

startServer();
