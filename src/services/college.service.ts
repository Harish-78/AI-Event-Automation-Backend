import sql from "../config/db.config";
import type { College } from "../types/entity.types";

export async function createCollege(data: Partial<College>): Promise<College> {
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
  return row;
}

export async function getAllColleges(params: {
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ colleges: College[]; total: number }> {
  const { search, limit = 10, offset = 0 } = params;

  let whereConditions: any[] = [sql`is_deleted = FALSE`];

  if (search) {
    const searchTerm = `%${search.trim().toLowerCase()}%`;
    whereConditions.push(sql`(LOWER(name) LIKE ${searchTerm} OR LOWER(short_name) LIKE ${searchTerm})`);
  }

  const whereClause = whereConditions.length > 0 ? sql`WHERE ${(sql as any).join(whereConditions, sql` AND `)}` : sql``;

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

  return { colleges, total };
}

export async function getCollegeById(id: string): Promise<College | null> {
  const [college] = await sql<College[]>`
    SELECT * FROM colleges WHERE id = ${id} AND is_deleted = FALSE
  `;
  return college || null;
}

export async function updateCollege(id: string, data: Partial<College>): Promise<College | null> {
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
      ${(sql as any)(updateData, columns)}
    WHERE id = ${id} AND is_deleted = FALSE
    RETURNING *
  `;

  return row || null;
}

export async function deleteCollege(id: string): Promise<boolean> {
  const result = await sql`
    UPDATE colleges SET is_deleted = TRUE, updated_at = NOW() WHERE id = ${id}
  `;
  return result.count > 0;
}
