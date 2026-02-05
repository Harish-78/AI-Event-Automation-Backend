import pool from "../config/db.config";
import type { Event } from "../types/entity.types";

export async function createEvent(data: Partial<Event>): Promise<Event> {
  const result = await pool.query<Event>(
    `INSERT INTO events (
      title, description, college_id, department_id, category, 
      start_time, end_time, location, registration_deadline, 
      max_participants, created_by, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *`,
    [
      data.title, data.description, data.college_id, data.department_id, data.category,
      data.start_time, data.end_time, data.location, data.registration_deadline,
      data.max_participants, data.created_by, data.status || 'draft'
    ]
  );
  return result.rows[0]!;
}

export async function getAllEvents(params: {
  college_id?: string;
  department_id?: string;
  category?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ events: Event[]; total: number }> {
  const { college_id, department_id, category, status, search, limit = 10, offset = 0 } = params;
  const values: any[] = [];
  let whereClause = "WHERE is_deleted = FALSE";

  if (college_id) {
    values.push(college_id);
    whereClause += ` AND college_id = $${values.length}`;
  }

  if (department_id) {
    values.push(department_id);
    whereClause += ` AND department_id = $${values.length}`;
  }

  if (category) {
    values.push(category);
    whereClause += ` AND category = $${values.length}`;
  }

  if (status) {
    values.push(status);
    whereClause += ` AND status = $${values.length}`;
  }

  if (search) {
    values.push(`%${search.trim().toLowerCase()}%`);
    whereClause += ` AND (LOWER(title) LIKE $${values.length} OR LOWER(description) LIKE $${values.length})`;
  }

  const countQuery = `SELECT COUNT(*) FROM events ${whereClause}`;
  const totalResult = await pool.query(countQuery, values);
  const total = parseInt(totalResult.rows[0]!.count, 10);

  const query = `
    SELECT * FROM events 
    ${whereClause} 
    ORDER BY start_time ASC 
    LIMIT $${values.length + 1} OFFSET $${values.length + 2}
  `;
  const result = await pool.query<Event>(query, [...values, limit, offset]);

  return { events: result.rows, total };
}

export async function getEventById(id: string): Promise<Event | null> {
  const result = await pool.query<Event>(
    "SELECT * FROM events WHERE id = $1 AND is_deleted = FALSE",
    [id]
  );
  return result.rows[0] || null;
}

export async function updateEvent(id: string, data: Partial<Event>): Promise<Event | null> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  const allowedFields = [
    "title", "description", "department_id", "category", 
    "start_time", "end_time", "location", "registration_deadline", 
    "max_participants", "status"
  ];

  for (const field of allowedFields) {
    if (data[field as keyof Event] !== undefined) {
      updates.push(`${field} = $${paramIndex++}`);
      values.push(data[field as keyof Event]);
    }
  }

  if (updates.length === 0) return null;

  values.push(id);
  const query = `
    UPDATE events 
    SET ${updates.join(", ")}, updated_at = NOW() 
    WHERE id = $${paramIndex} AND is_deleted = FALSE 
    RETURNING *
  `;
  const result = await pool.query<Event>(query, values);
  return result.rows[0] || null;
}

export async function deleteEvent(id: string): Promise<boolean> {
  const result = await pool.query(
    "UPDATE events SET is_deleted = TRUE, updated_at = NOW() WHERE id = $1",
    [id]
  );
  return (result.rowCount ?? 0) > 0;
}
