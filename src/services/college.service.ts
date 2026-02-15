import pool from "../config/db.config";
import type { College } from "../types/entity.types";

export async function createCollege(data: Partial<College>): Promise<College> {
  const result = await pool.query<College>(
    `INSERT INTO colleges (
      name, city, taluka, district, state, zip_code, country, 
      short_name, contact_email, contact_phone, website_url, 
      registration_number, logo_url
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *`,
    [
      data.name, data.city, data.taluka, data.district, data.state, data.zip_code, data.country,
      data.short_name, data.contact_email, data.contact_phone, data.website_url,
      data.registration_number, data.logo_url
    ]
  );
  return result.rows[0]!;
}

export async function getAllColleges(params: {
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ colleges: College[]; total: number }> {
  const { search, limit = 10, offset = 0 } = params;
  const values: any[] = [];
  let whereClause = "WHERE is_deleted = FALSE";

  if (search) {
    values.push(`%${search.trim().toLowerCase()}%`);
    whereClause += ` AND (LOWER(name) LIKE $1 OR LOWER(short_name) LIKE $1)`;
  }

  const countQuery = `SELECT COUNT(*) FROM colleges ${whereClause}`;
  const totalResult = await pool.query(countQuery, values);
  const total = parseInt(totalResult.rows[0]!.count, 10);

  const query = `
    SELECT * FROM colleges 
    ${whereClause} 
    ORDER BY created_at DESC 
    LIMIT $${values.length + 1} OFFSET $${values.length + 2}
  `;
  const result = await pool.query<College>(query, [...values, limit, offset]);

  return { colleges: result.rows, total };
}

export async function getCollegeById(id: string): Promise<College | null> {
  const result = await pool.query<College>(
    "SELECT * FROM colleges WHERE id = $1 AND is_deleted = FALSE",
    [id]
  );
  return result.rows[0] || null;
}

export async function updateCollege(id: string, data: Partial<College>): Promise<College | null> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  const allowedFields = [
    "name", "city", "taluka", "district", "state", "zip_code", "country",
    "short_name", "contact_email", "contact_phone", "website_url",
    "registration_number", "logo_url"
  ];

  for (const field of allowedFields) {
    if (data[field as keyof College] !== undefined) {
      updates.push(`${field} = $${paramIndex++}`);
      values.push(data[field as keyof College]);
    }
  }

  if (updates.length === 0) return null;

  values.push(id);
  const query = `
    UPDATE colleges 
    SET ${updates.join(", ")}, updated_at = NOW() 
    WHERE id = $${paramIndex} AND is_deleted = FALSE 
    RETURNING *
  `;
  const result = await pool.query<College>(query, values);
  return result.rows[0] || null;
}

export async function deleteCollege(id: string): Promise<boolean> {
  const result = await pool.query(
    "UPDATE colleges SET is_deleted = TRUE, updated_at = NOW() WHERE id = $1",
    [id]
  );
  return (result.rowCount ?? 0) > 0;
}
