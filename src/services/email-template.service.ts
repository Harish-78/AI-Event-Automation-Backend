import sql from "../config/db.config";
import { logger } from "../logger/logger";
import type { EmailTemplate } from "../types/entity.types";

export async function createTemplate(data: Partial<EmailTemplate>): Promise<EmailTemplate> {
  logger.info({ name: data.name }, "EmailTemplateService: createTemplate - Init");
  const [row] = await sql<EmailTemplate[]>`
    INSERT INTO email_templates (
      name, subject, mjml_content, created_by, college_id
    ) VALUES (
      ${data.name!}, ${data.subject || null}, ${data.mjml_content!}, ${data.created_by!}, ${data.college_id!}
    )
    RETURNING *
  `;
  if (!row) throw new Error("Insert failed");
  logger.info({ templateId: row.id }, "EmailTemplateService: createTemplate - Completion");
  return row;
}

export async function getAllTemplates(params: {
  created_by?: string;
  college_id?: string | undefined; // This already allows undefined
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ templates: EmailTemplate[]; total: number }> {
  logger.info(params, "EmailTemplateService: getAllTemplates - Init");
  const { created_by, college_id, search, limit = 10, offset = 0 } = params;
  const conditions: any[] = [sql`is_deleted = FALSE`];

  if (created_by) {
    conditions.push(sql`created_by = ${created_by}`);
  }
  if (college_id) {
    conditions.push(sql`college_id = ${college_id}`);
  }
  if (search) {
    const searchTerm = `%${search.trim().toLowerCase()}%`;
    conditions.push(sql`(LOWER(name) LIKE ${searchTerm} OR LOWER(subject) LIKE ${searchTerm})`);
  }

  const whereClause = conditions.length > 0
    ? sql`WHERE ${conditions.reduce((acc, cond) => sql`${acc} AND ${cond}`)}`
    : sql``;

  const [totalResult] = await sql<{ count: string }[]>`
    SELECT COUNT(*) FROM email_templates ${whereClause}
  `;
  const total = parseInt(totalResult!.count, 10);

  const templates = await sql<EmailTemplate[]>`
    SELECT * FROM email_templates 
    ${whereClause} 
    ORDER BY created_at DESC 
    LIMIT ${limit} OFFSET ${offset}
  `;
  logger.info({ count: templates.length, total }, "EmailTemplateService: getAllTemplates - Completion");
  return { templates, total };
}

export async function getTemplateById(id: string): Promise<EmailTemplate | null> {
  logger.info({ templateId: id }, "EmailTemplateService: getTemplateById - Init");
  const [row] = await sql<EmailTemplate[]>`
    SELECT * FROM email_templates WHERE id = ${id} AND is_deleted = FALSE
  `;
  const result = row || null;
  logger.info({ templateId: id, found: !!result }, "EmailTemplateService: getTemplateById - Completion");
  return result;
}

export async function updateTemplate(id: string, data: Partial<EmailTemplate>): Promise<EmailTemplate | null> {
  logger.info({ templateId: id }, "EmailTemplateService: updateTemplate - Init");
  const updateData: any = { updated_at: sql`NOW()` };
  const columns = ["updated_at"];

  const allowedFields = ["name", "subject", "mjml_content", "college_id"];

  for (const field of allowedFields) {
    if (data[field as keyof EmailTemplate] !== undefined) {
      updateData[field] = data[field as keyof EmailTemplate];
      columns.push(field);
    }
  }

  if (columns.length === 1 && columns[0] === "updated_at") {
    return await getTemplateById(id);
  }

  const [row] = await sql<EmailTemplate[]>`
    UPDATE email_templates SET 
      ${sql(updateData, columns)}
    WHERE id = ${id} AND is_deleted = FALSE 
    RETURNING *
  `;
  logger.info({ templateId: id, success: !!row }, "EmailTemplateService: updateTemplate - Completion");
  return row || null;
}

export async function deleteTemplate(id: string): Promise<boolean> {
  logger.info({ templateId: id }, "EmailTemplateService: deleteTemplate - Init");
  const result = await sql`
    UPDATE email_templates SET is_deleted = TRUE, updated_at = NOW() WHERE id = ${id}
  `;
  const success = result.count > 0;
  logger.info({ templateId: id, success }, "EmailTemplateService: deleteTemplate - Completion");
  return success;
}
