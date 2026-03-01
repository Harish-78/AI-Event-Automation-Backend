import { queueEmail } from "../services/mail.producer";
import { initRabbitMQ, closeRabbitMQ, getChannel, MAIL_QUEUE } from "../config/rabbitmq.config";
import { logger } from "../logger/logger";

async function runTest() {
  logger.info("Starting RabbitMQ Integration Test...");
  
  try {
    await initRabbitMQ();
    const channel = getChannel();

    // 1. Test Producer
    const testJob = {
      to: "test@example.com",
      subject: "Test Email",
      html: "<h1>Hello World</h1>"
    };
    
    logger.info("Step 1: Testing Producer...");
    const queued = await queueEmail(testJob);
    if (!queued) throw new Error("Failed to queue email");
    logger.info("Email queued successfully");

    // 2. Verify message in queue
    logger.info("Step 2: Verifying message in queue...");
    const msg = await channel.get(MAIL_QUEUE);
    if (!msg) throw new Error("Message not found in queue");
    
    const content = JSON.parse(msg.content.toString());
    if (content.to !== testJob.to) {
      throw new Error(`Message content mismatch. Expected ${testJob.to}, got ${content.to}`);
    }
    
    logger.info("Message verified in queue correctly");
    
    // Ack the message so it doesn't stay there
    channel.ack(msg);
    logger.info("Message acknowledged");

    logger.info("RabbitMQ Integration Test PASSED!");

  } catch (error) {
    logger.error({ error }, "RabbitMQ Integration Test FAILED");
    process.exit(1);
  } finally {
    await closeRabbitMQ();
  }
}

runTest();
