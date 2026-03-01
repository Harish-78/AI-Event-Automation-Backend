import mjml2html from "mjml";
import { logger } from "../logger/logger";
import { consumeQueue } from "../services/rabbitmq.service";
import { rabbitSettings } from "../config/rabbitmq.config";
import * as campaignService from "../services/campaign.service";
import * as templateService from "../services/email-template.service";
import * as emailService from "../services/email.service";
import * as userService from "../services/user.service";

interface CampaignJob {
    campaignId: string;
    targetEmails?: string[];
}

export async function startCampaignWorker() {
    logger.info("CampaignWorker: Starting...");

    await consumeQueue(rabbitSettings.queues.campaign, async (job: CampaignJob) => {
        const { campaignId, targetEmails } = job;
        logger.info({ campaignId }, "CampaignWorker: Processing campaign");

        try {
            // 1. Fetch Campaign
            const campaign = await campaignService.getCampaignById(campaignId);
            if (!campaign) {
                logger.error({ campaignId }, "CampaignWorker: Campaign not found");
                return;
            }

            if (!campaign.template_id) {
                logger.error({ campaignId }, "CampaignWorker: Campaign has no template");
                await campaignService.updateCampaign(campaignId, { status: "failed" });
                return;
            }

            // 2. Fetch Template
            const template = await templateService.getTemplateById(campaign.template_id);
            if (!template) {
                logger.error({ templateId: campaign.template_id }, "CampaignWorker: Template not found");
                await campaignService.updateCampaign(campaignId, { status: "failed" });
                return;
            }

            // 3. Update Status to 'sending'
            await campaignService.updateCampaign(campaignId, { status: "sending" });

            // 4. Determine Recipients
            let recipients: string[] = [];
            if (targetEmails && targetEmails.length > 0) {
                recipients = targetEmails;
            } else {
                const users = await userService.getUsersByCollege(campaign.college_id);
                recipients = users.map(u => u.email);
            }

            if (recipients.length === 0) {
                logger.warn({ campaignId }, "CampaignWorker: No recipients found");
                await campaignService.updateCampaign(campaignId, { status: "sent" }); // Technically nothing to send
                return;
            }

            // 5. Compile MJML
            const { html, errors } = mjml2html(template.mjml_content);
            if (errors.length > 0) {
                logger.error({ errors, campaignId }, "CampaignWorker: MJML compilation errors");
                // We might still send if it generated something, but usually better to fail
            }

            // 6. Send Emails
            const subject = template.subject || campaign.name;

            logger.info({ campaignId, count: recipients.length }, "CampaignWorker: Sending emails");

            // For production, you might want to chunk this or use CC/BCC if appropriate, 
            // but usually separate emails for personalization.
            const sendPromises = recipients.map(email =>
                emailService.sendCampaignEmail(email, subject, html)
                    .catch(err => logger.error({ err, email, campaignId }, "CampaignWorker: Failed to send to recipient"))
            );

            await Promise.all(sendPromises);

            // 7. Success
            await campaignService.updateCampaign(campaignId, { status: "sent" });
            logger.info({ campaignId }, "CampaignWorker: Campaign completed successfully");

        } catch (error) {
            logger.error({ error, campaignId }, "CampaignWorker: unexpected error");
            await campaignService.updateCampaign(campaignId, { status: "failed" });
        }
    });
}
