import sql from "../config/db.config";
import { logger } from "../logger/logger";
import type { College } from "../types/entity.types";

export async function createCollege(data: Partial<College>): Promise<College> {
  logger.info({ collegeName: data.name }, "CollegeService: createCollege - Init");
  const [row] = await sql<College[]>`
    INSERT INTO colleges (
      name, city, taluka, district, state, zip_code, country, 
      short_name, contact_email, contact_phone, website_url, 
      registration_number, logo_url
    ) VALUES (
      ${data.name!}, ${data.city || null}, ${data.taluka || null}, ${data.district || null}, 
      ${data.state || null}, ${data.zip_code || null}, ${data.country || null},
      ${data.short_name || null}, ${data.contact_email || null}, ${data.contact_phone || null}, 
      ${data.website_url || null}, ${data.registration_number || null}, ${data.logo_url || null}
    )
    RETURNING *
  `;
  if (!row) throw new Error("Insert failed");
  logger.info({ collegeId: row.id }, "CollegeService: createCollege - Completion");
  return row;
}

export async function getAllColleges(params: {
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ colleges: College[]; total: number }> {
  logger.info(params, "CollegeService: getAllColleges - Init");
  const { search, limit = 10, offset = 0 } = params;

  let whereConditions: any[] = [sql`is_deleted = FALSE`];

  if (search) {
    const searchTerm = `%${search.trim().toLowerCase()}%`;
    whereConditions.push(sql`(LOWER(name) LIKE ${searchTerm} OR LOWER(short_name) LIKE ${searchTerm})`);
  }

  const whereClause = whereConditions.length > 0 
    ? sql`WHERE ${whereConditions.reduce((acc, cond) => sql`${acc} AND ${cond}`)}` 
    : sql``;

  const [totalResult] = await sql<{ count: string }[]>`
    SELECT COUNT(*) FROM colleges ${whereClause}
  `;
  const total = parseInt(totalResult!.count, 10);

  const colleges = await sql<College[]>`
    SELECT * FROM colleges
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;
  logger.info({ count: colleges.length, total }, "CollegeService: getAllColleges - Completion");
  return { colleges, total };
}

export async function getCollegeById(id: string): Promise<College | null> {
  logger.info({ collegeId: id }, "CollegeService: getCollegeById - Init");
  const [college] = await sql<College[]>`
    SELECT * FROM colleges WHERE id = ${id} AND is_deleted = FALSE
  `;
  const result = college || null;
  logger.info({ collegeId: id, found: !!result }, "CollegeService: getCollegeById - Completion");
  return result;
}

export async function updateCollege(id: string, data: Partial<College>): Promise<College | null> {
  logger.info({ collegeId: id }, "CollegeService: updateCollege - Init");
  const updateData: any = { updated_at: sql`NOW()` };
  const columns: string[] = ["updated_at"];

  const allowedFields = [
    "name", "city", "taluka", "district", "state", "zip_code", "country",
    "short_name", "contact_email", "contact_phone", "website_url",
    "registration_number", "logo_url"
  ];

  for (const field of allowedFields) {
    if (data[field as keyof College] !== undefined) {
      updateData[field] = data[field as keyof College];
      columns.push(field);
    }
  }

  if (columns.length === 1 && columns[0] === "updated_at") {
    return await getCollegeById(id);
  }

  const [row] = await sql<College[]>`
    UPDATE colleges SET
      ${sql(updateData, columns)}
    WHERE id = ${id} AND is_deleted = FALSE
    RETURNING *
  `;

  logger.info({ collegeId: id, success: !!row }, "CollegeService: updateCollege - Completion");
  return row || null;
}

export async function deleteCollege(id: string): Promise<boolean> {
  logger.info({ collegeId: id }, "CollegeService: deleteCollege - Init");
  const result = await sql`
    UPDATE colleges SET is_deleted = TRUE, updated_at = NOW() WHERE id = ${id}
  `;
  const success = result.count > 0;
  logger.info({ collegeId: id, success }, "CollegeService: deleteCollege - Completion");
  return success;
}
