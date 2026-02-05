import pool from "../config/db.config";
import type { Department } from "../types/entity.types";

export async function createDepartment(data: Partial<Department>): Promise<Department> {
  const result = await pool.query<Department>(
    `INSERT INTO departments (college_id, name, short_name, contact_email, contact_phone)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [data.college_id, data.name, data.short_name, data.contact_email, data.contact_phone]
  );
  return result.rows[0]!;
}

export async function getAllDepartments(params: {
  college_id?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ departments: Department[]; total: number }> {
  const { college_id, search, limit = 10, offset = 0 } = params;
  const values: any[] = [];
  let whereClause = "WHERE is_deleted = FALSE";

  if (college_id) {
    values.push(college_id);
    whereClause += ` AND college_id = $${values.length}`;
  }

  if (search) {
    values.push(`%${search.trim().toLowerCase()}%`);
    whereClause += ` AND (LOWER(name) LIKE $${values.length} OR LOWER(short_name) LIKE $${values.length})`;
  }

  const countQuery = `SELECT COUNT(*) FROM departments ${whereClause}`;
  const totalResult = await pool.query(countQuery, values);
  const total = parseInt(totalResult.rows[0]!.count, 10);

  const query = `
    SELECT * FROM departments 
    ${whereClause} 
    ORDER BY created_at DESC 
    LIMIT $${values.length + 1} OFFSET $${values.length + 2}
  `;
  const result = await pool.query<Department>(query, [...values, limit, offset]);

  return { departments: result.rows, total };
}

export async function getDepartmentById(id: string): Promise<Department | null> {
  const result = await pool.query<Department>(
    "SELECT * FROM departments WHERE id = $1 AND is_deleted = FALSE",
    [id]
  );
  return result.rows[0] || null;
}

export async function updateDepartment(id: string, data: Partial<Department>): Promise<Department | null> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  const allowedFields = ["name", "short_name", "contact_email", "contact_phone"];

  for (const field of allowedFields) {
    if (data[field as keyof Department] !== undefined) {
      updates.push(`${field} = $${paramIndex++}`);
      values.push(data[field as keyof Department]);
    }
  }

  if (updates.length === 0) return null;

  values.push(id);
  const query = `
    UPDATE departments 
    SET ${updates.join(", ")}, updated_at = NOW() 
    WHERE id = $${paramIndex} AND is_deleted = FALSE 
    RETURNING *
  `;
  const result = await pool.query<Department>(query, values);
  return result.rows[0] || null;
}

export async function deleteDepartment(id: string): Promise<boolean> {
  const result = await pool.query(
    "UPDATE departments SET is_deleted = TRUE, updated_at = NOW() WHERE id = $1",
    [id]
  );
  return (result.rowCount ?? 0) > 0;
}
