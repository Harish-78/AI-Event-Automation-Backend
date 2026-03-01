import amqp from "amqplib";
import { logger } from "../logger/logger";

let connection: any = null;
let channel: any = null;

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost";
export const MAIL_QUEUE = "mail_queue";

export async function initRabbitMQ() {
  try {
    logger.info({ url: RABBITMQ_URL }, "Initializing RabbitMQ...");
    connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    
    await channel.assertQueue(MAIL_QUEUE, {
      durable: true
    });
    
    logger.info("RabbitMQ initialized successfully");
    
    connection.on("error", (err: any) => {
      logger.error({ err }, "RabbitMQ connection error");
    });
    
    connection.on("close", () => {
      logger.warn("RabbitMQ connection closed");
    });

  } catch (error) {
    logger.error({ error }, "Failed to initialize RabbitMQ");
    throw error;
  }
}

export function getChannel(): any {
  if (!channel) {
    throw new Error("RabbitMQ channel not initialized. Call initRabbitMQ first.");
  }
  return channel;
}

export async function closeRabbitMQ() {
  try {
    if (channel) await channel.close();
    if (connection) await connection.close();
    logger.info("RabbitMQ connection closed");
  } catch (error) {
    logger.error({ error }, "Error closing RabbitMQ");
  }
}
