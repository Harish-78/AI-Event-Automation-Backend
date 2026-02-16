import sql from "../config/db.config";
import type { Department } from "../types/entity.types";

export async function createDepartment(data: Partial<Department>): Promise<Department> {
  const { name, college_id, short_name, contact_email, contact_phone } = data;
  const [row] = await sql<Department[]>`
    INSERT INTO departments (name, college_id, short_name, contact_email, contact_phone)
    VALUES (${name!}, ${college_id!}, ${short_name || null}, ${contact_email || null}, ${contact_phone || null})
    RETURNING *
  `;
  if (!row) throw new Error("Insert failed");
  return row;
}

export async function getAllDepartments(params: {
  college_id?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ departments: Department[]; total: number }> {
  const { college_id, search, limit = 10, offset = 0 } = params;
  const conditions: any[] = [sql`is_deleted = FALSE`];

  if (college_id) {
    conditions.push(sql`college_id = ${college_id}`);
  }

  if (search) {
    const searchTerm = `%${search.trim().toLowerCase()}%`;
    conditions.push(sql`(LOWER(name) LIKE ${searchTerm} OR LOWER(short_name) LIKE ${searchTerm})`);
  }

  const whereClause = conditions.length > 0 ? sql`WHERE ${(sql as any).join(conditions, sql` AND `)}` : sql``;

  const [totalResult] = await sql<{ count: string }[]>`
    SELECT COUNT(*) FROM departments ${whereClause}
  `;
  const total = parseInt(totalResult!.count, 10);

  const departments = await sql<Department[]>`
    SELECT * FROM departments
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  return { departments, total };
}

export async function getDepartmentById(id: string): Promise<Department | null> {
  const [row] = await sql<Department[]>`
    SELECT * FROM departments WHERE id = ${id} AND is_deleted = FALSE
  `;
  return row || null;
}

export async function updateDepartment(id: string, data: Partial<Department>): Promise<Department | null> {
  const updateData: any = { updated_at: sql`NOW()` };
  const columns = ["updated_at"];

  const allowedFields = ["name", "short_name", "contact_email", "contact_phone", "college_id"];

  for (const field of allowedFields) {
    if (data[field as keyof Department] !== undefined) {
      updateData[field] = data[field as keyof Department];
      columns.push(field);
    }
  }

  if (columns.length === 1 && columns[0] === "updated_at") {
    return await getDepartmentById(id);
  }

  const [row] = await sql<Department[]>`
    UPDATE departments SET
      ${(sql as any)(updateData, columns)}
    WHERE id = ${id} AND is_deleted = FALSE
    RETURNING *
  `;

  return row || null;
}

export async function deleteDepartment(id: string): Promise<boolean> {
  const result = await sql`
    UPDATE departments SET is_deleted = TRUE, updated_at = NOW() WHERE id = ${id}
  `;
  return result.count > 0;
}
