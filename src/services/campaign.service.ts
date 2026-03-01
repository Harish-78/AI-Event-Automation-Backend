import sql from "../config/db.config";
import { logger } from "../logger/logger";
import type { Campaign } from "../types/entity.types";
import { sendToQueue } from "./rabbitmq.service";
import { rabbitSettings } from "../config/rabbitmq.config";

export async function createCampaign(data: Partial<Campaign>): Promise<Campaign> {
  logger.info({ name: data.name }, "CampaignService: createCampaign - Init");
  const [row] = await sql<Campaign[]>`
    INSERT INTO campaigns (
      name, description, template_id, status, scheduled_at, created_by, college_id
    ) VALUES (
      ${data.name!}, ${data.description || null}, ${data.template_id || null}, 
      ${data.status || 'draft'}, ${data.scheduled_at || null}, ${data.created_by!}, ${data.college_id!}
    )
    RETURNING *
  `;
  if (!row) throw new Error("Insert failed");
  logger.info({ campaignId: row.id }, "CampaignService: createCampaign - Completion");
  return row;
}

export async function getAllCampaigns(params: {
  created_by?: string;
  college_id?: string | undefined;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ campaigns: Campaign[]; total: number }> {
  logger.info(params, "CampaignService: getAllCampaigns - Init");
  const { created_by, college_id, status, search, limit = 10, offset = 0 } = params;
  const conditions: any[] = [sql`is_deleted = FALSE`];

  if (created_by) {
    conditions.push(sql`created_by = ${created_by}`);
  }
  if (college_id) {
    conditions.push(sql`college_id = ${college_id}`);
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

  const allowedFields = ["name", "description", "template_id", "status", "scheduled_at", "college_id"];

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

export async function triggerCampaign(campaignId: string, options: { targetEmails?: string[] } = {}): Promise<boolean> {
  logger.info({ campaignId, options }, "CampaignService: triggerCampaign - Init");

  const campaign = await getCampaignById(campaignId);
  if (!campaign) {
    throw new Error("Campaign not found");
  }

  const job = {
    campaignId,
    targetEmails: options.targetEmails,
  };

  const success = await sendToQueue(rabbitSettings.queues.campaign, job);

  if (success) {
    await updateCampaign(campaignId, { status: "scheduled" });
  }

  logger.info({ campaignId, success }, "CampaignService: triggerCampaign - Completion");
  return success;
}
