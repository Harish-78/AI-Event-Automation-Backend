import dotenv from "dotenv";
dotenv.config();

export const rabbitSettings = {
    url: process.env.RABBITMQ_URL || "amqp://localhost",
    queues: {
        campaign: "email_campaign_queue",
    },
};
