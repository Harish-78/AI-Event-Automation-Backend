import sql from "../config/db.config";
import { logger } from "../logger/logger";
import type { Campaign, EmailTemplate } from "../types/entity.types";
import { getTemplateById } from "./email-template.service";
import mjml2html from "mjml";
import { queueEmail } from "./mail.producer";

export async function createCampaign(data: Partial<Campaign>): Promise<Campaign> {
    logger.info({ name: data.name }, "CampaignService: createCampaign - Init");
    const [row] = await sql<Campaign[]>`
    INSERT INTO campaigns (
      name, description, template_id, status, scheduled_at, created_by
    ) VALUES (
      ${data.name!}, ${data.description || null}, ${data.template_id || null}, 
      ${data.status || 'draft'}, ${data.scheduled_at || null}, ${data.created_by!}
    )
    RETURNING *
  `;
    if (!row) throw new Error("Insert failed");
    logger.info({ campaignId: row.id }, "CampaignService: createCampaign - Completion");
    return row;
}

export async function getAllCampaigns(params: {
    created_by?: string;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
}): Promise<{ campaigns: Campaign[]; total: number }> {
    logger.info(params, "CampaignService: getAllCampaigns - Init");
    const { created_by, status, search, limit = 10, offset = 0 } = params;
    const conditions: any[] = [sql`is_deleted = FALSE`];

    if (created_by) {
        conditions.push(sql`created_by = ${created_by}`);
    }
    if (status) {
        conditions.push(sql`status = ${status}`);
    }
    if (search) {
        const searchTerm = `%${search.trim().toLowerCase()}%`;
        conditions.push(sql`(LOWER(name) LIKE ${searchTerm} OR LOWER(description) LIKE ${searchTerm})`);
    }

    const whereClause = conditions.length > 0
        ? sql`WHERE ${conditions.reduce((acc, cond) => sql`${acc} AND ${cond}`)}`
        : sql``;

    const [totalResult] = await sql<{ count: string }[]>`
    SELECT COUNT(*) FROM campaigns ${whereClause}
  `;
    const total = parseInt(totalResult!.count, 10);

    const campaigns = await sql<Campaign[]>`
    SELECT * FROM campaigns 
    ${whereClause} 
    ORDER BY created_at DESC 
    LIMIT ${limit} OFFSET ${offset}
  `;
    logger.info({ count: campaigns.length, total }, "CampaignService: getAllCampaigns - Completion");
    return { campaigns, total };
}

export async function getCampaignById(id: string): Promise<Campaign | null> {
    logger.info({ campaignId: id }, "CampaignService: getCampaignById - Init");
    const [row] = await sql<Campaign[]>`
    SELECT * FROM campaigns WHERE id = ${id} AND is_deleted = FALSE
  `;
    const result = row || null;
    logger.info({ campaignId: id, found: !!result }, "CampaignService: getCampaignById - Completion");
    return result;
}

export async function updateCampaign(id: string, data: Partial<Campaign>): Promise<Campaign | null> {
    logger.info({ campaignId: id }, "CampaignService: updateCampaign - Init");
    const updateData: any = { updated_at: sql`NOW()` };
    const columns = ["updated_at"];

    const allowedFields = ["name", "description", "template_id", "status", "scheduled_at"];

    for (const field of allowedFields) {
        if (data[field as keyof Campaign] !== undefined) {
            updateData[field] = data[field as keyof Campaign];
            columns.push(field);
        }
    }

    if (columns.length === 1 && columns[0] === "updated_at") {
        return await getCampaignById(id);
    }

    const [row] = await sql<Campaign[]>`
    UPDATE campaigns SET 
      ${sql(updateData, columns)}
    WHERE id = ${id} AND is_deleted = FALSE 
    RETURNING *
  `;
    logger.info({ campaignId: id, success: !!row }, "CampaignService: updateCampaign - Completion");
    return row || null;
}

export async function deleteCampaign(id: string): Promise<boolean> {
    logger.info({ campaignId: id }, "CampaignService: deleteCampaign - Init");
    const result = await sql`
    UPDATE campaigns SET is_deleted = TRUE, updated_at = NOW() WHERE id = ${id}
  `;
    const success = result.count > 0;
    logger.info({ campaignId: id, success }, "CampaignService: deleteCampaign - Completion");
    return success;
}

export async function executeCampaign(campaignId: string): Promise<void> {
    logger.info({ campaignId }, "CampaignService: executeCampaign - Init");
    try {
        const campaign = await getCampaignById(campaignId);
        if (!campaign || !campaign.template_id) {
            throw new Error("Campaign or template not found");
        }

        const template = await getTemplateById(campaign.template_id);
        if (!template) {
            throw new Error("Email template not found");
        }

        // Update status to sending
        await updateCampaign(campaignId, { status: "sending" });

        // Compile MJML to HTML
        const { html: compiledHtml } = mjml2html(template.mjml_content);

        // Fetch users to send email to
        // For now, let's say we send to all users of the same college as the campaign creator
        // or all users if superadmin.
        const [creator] = await sql<{ role: string; college_id: string }[]>`
            SELECT role, college_id FROM users WHERE id = ${campaign.created_by}
        `;
        
        if (!creator) throw new Error("Campaign creator not found");

        let users;
        if (creator.role === "superadmin") {
            users = await sql<{ email: string; name: string }[]>`
                SELECT email, name FROM users WHERE is_deleted = FALSE
            `;
        } else {
            users = await sql<{ email: string; name: string }[]>`
                SELECT email, name FROM users WHERE college_id = ${creator.college_id} AND is_deleted = FALSE
            `;
        }

        logger.info({ campaignId, userCount: users.length }, "CampaignService: executeCampaign - Queuing emails");

        for (const user of users) {
            // Basic placeholder substitution
            let userHtml = compiledHtml.replace(/\{\{name\}\}/g, user.name || "User");
            
            await queueEmail({
                to: user.email,
                subject: template.subject || campaign.name,
                html: userHtml
            });
        }

        // Update status to sent
        await updateCampaign(campaignId, { status: "sent" });
        logger.info({ campaignId }, "CampaignService: executeCampaign - Completion");

    } catch (error) {
        logger.error({ error, campaignId }, "CampaignService: executeCampaign - Failed");
        await updateCampaign(campaignId, { status: "failed" });
        throw error;
    }
}
