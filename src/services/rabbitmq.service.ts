import * as amqp from "amqplib";
import { logger } from "../logger/logger";
import { rabbitSettings } from "../config/rabbitmq.config";

let connection: any = null;
let channel: any = null;

export async function connectRabbitMQ(): Promise<{ connection: any; channel: any }> {
    if (connection && channel) {
        return { connection, channel };
    }

    try {
        const conn = await amqp.connect(rabbitSettings.url);
        const chan = await conn.createChannel();

        // Ensure queues exist
        for (const queue of Object.values(rabbitSettings.queues)) {
            await chan.assertQueue(queue, { durable: true });
        }

        connection = conn;
        channel = chan;

        logger.info("RabbitMQ: Connected and channels established");

        conn.on("error", (err: any) => {
            logger.error({ err }, "RabbitMQ: Connection error");
            connection = null;
            channel = null;
        });

        conn.on("close", () => {
            logger.warn("RabbitMQ: Connection closed");
            connection = null;
            channel = null;
        });

        return { connection: conn, channel: chan };
    } catch (err) {
        logger.error({ err }, "RabbitMQ: Connection failed");
        throw err;
    }
}

export async function sendToQueue(queue: string, data: any): Promise<boolean> {
    try {
        const { channel: chan } = await connectRabbitMQ();
        return chan.sendToQueue(queue, Buffer.from(JSON.stringify(data)), {
            persistent: true,
        });
    } catch (err) {
        logger.error({ err, queue }, "RabbitMQ: Failed to send to queue");
        return false;
    }
}

export async function consumeQueue(queue: string, onMessage: (msg: any) => Promise<void>) {
    try {
        const { channel: chan } = await connectRabbitMQ();
        await chan.prefetch(1); 

        logger.info({ queue }, "RabbitMQ: Starting consumer");

        await chan.consume(
            queue,
            async (msg: any) => {
                if (!msg) return;
                try {
                    const content = JSON.parse(msg.content.toString());
                    await onMessage(content);
                    chan.ack(msg);
                } catch (err) {
                    logger.error({ err, queue }, "RabbitMQ: Consumer error processing message");
                    chan.nack(msg, false, true);
                }
            },
            { noAck: false }
        );
    } catch (err) {
        logger.error({ err, queue }, "RabbitMQ: Failed to start consumer");
        throw err;
    }
}
