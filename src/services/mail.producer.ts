import { getChannel, MAIL_QUEUE } from "../config/rabbitmq.config";
import { logger } from "../logger/logger";

export interface EmailJob {
  to: string;
  subject: string;
  html: string;
}

export async function queueEmail(job: EmailJob): Promise<boolean> {
  try {
    const channel = getChannel();
    const result = channel.sendToQueue(
      MAIL_QUEUE,
      Buffer.from(JSON.stringify(job)),
      { persistent: true }
    );
    
    if (result) {
      logger.info({ to: job.to, subject: job.subject }, "Email queued successfully");
    } else {
      logger.error({ to: job.to }, "Failed to queue email (buffer full)");
    }
    
    return result;
  } catch (error) {
    logger.error({ error, to: job.to }, "Error queuing email");
    return false;
  }
}
