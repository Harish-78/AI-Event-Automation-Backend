import { getChannel, MAIL_QUEUE } from "../config/rabbitmq.config";
import { logger } from "../logger/logger";
import { sendEmail } from "./email.service";
import { EmailJob } from "./mail.producer";

export async function startMailConsumer() {
  try {
    const channel = getChannel();
    
    logger.info("Starting Mail Consumer worker...");
    
    await channel.consume(MAIL_QUEUE, async (msg) => {
      if (msg) {
        try {
          const job: EmailJob = JSON.parse(msg.content.toString());
          logger.info({ to: job.to, subject: job.subject }, "Processing queued email");
          
          await sendEmail(job);
          
          channel.ack(msg);
          logger.info({ to: job.to }, "Email processed and acknowledged");
        } catch (error) {
          logger.error({ error }, "Error processing queued email");
          // On error, we might want to dead-letter or nack with requeue: false
          // For now, let's just nack with requeue: false to avoid infinite loops if it's a data error
          channel.nack(msg, false, false);
        }
      }
    });

  } catch (error) {
    logger.error({ error }, "Failed to start Mail Consumer");
    throw error;
  }
}
