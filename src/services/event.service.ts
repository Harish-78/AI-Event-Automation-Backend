import sql from "../config/db.config";
import type { Event } from "../types/entity.types";

export async function createEvent(data: Partial<Event>): Promise<Event> {
  const [row] = await sql<Event[]>`
    INSERT INTO events (
      title, description, college_id, department_id, category, 
      start_time, end_time, location, registration_deadline, 
      max_participants, created_by, status
    ) VALUES (
      ${data.title!}, ${data.description || null}, ${data.college_id!}, ${data.department_id || null}, ${data.category!},
      ${data.start_time!}, ${data.end_time!}, ${data.location || null}, ${data.registration_deadline || null},
      ${data.max_participants || null}, ${data.created_by!}, ${data.status || 'draft'}
    )
    RETURNING *
  `;
  if (!row) throw new Error("Insert failed");
  return row;
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
  const conditions: any[] = [sql`is_deleted = FALSE`];

  if (college_id) {
    conditions.push(sql`college_id = ${college_id}`);
  }
  if (department_id) {
    conditions.push(sql`department_id = ${department_id}`);
  }
  if (category) {
    conditions.push(sql`category = ${category}`);
  }
  if (status) {
    conditions.push(sql`status = ${status}`);
  }
  if (search) {
    const searchTerm = `%${search.trim().toLowerCase()}%`;
    conditions.push(sql`(LOWER(title) LIKE ${searchTerm} OR LOWER(description) LIKE ${searchTerm})`);
  }

  const whereClause = conditions.length > 0 ? sql`WHERE ${(sql as any).join(conditions, sql` AND `)}` : sql``;

  const [totalResult] = await sql<{ count: string }[]>`
    SELECT COUNT(*) FROM events ${whereClause}
  `;
  const total = parseInt(totalResult!.count, 10);

  const events = await sql<Event[]>`
    SELECT * FROM events 
    ${whereClause} 
    ORDER BY start_time ASC 
    LIMIT ${limit} OFFSET ${offset}
  `;

  return { events, total };
}

export async function getEventById(id: string): Promise<Event | null> {
  const [row] = await sql<Event[]>`
    SELECT * FROM events WHERE id = ${id} AND is_deleted = FALSE
  `;
  return row || null;
}

export async function updateEvent(id: string, data: Partial<Event>): Promise<Event | null> {
  const updateData: any = { updated_at: sql`NOW()` };
  const columns = ["updated_at"];

  const allowedFields = [
    "title", "description", "department_id", "category", 
    "start_time", "end_time", "location", "registration_deadline", 
    "max_participants", "status"
  ];

  for (const field of allowedFields) {
    if (data[field as keyof Event] !== undefined) {
      updateData[field] = data[field as keyof Event];
      columns.push(field);
    }
  }

  if (columns.length === 1 && columns[0] === "updated_at") {
    return await getEventById(id);
  }

  const [row] = await sql<Event[]>`
    UPDATE events SET 
      ${(sql as any)(updateData, columns)}
    WHERE id = ${id} AND is_deleted = FALSE 
    RETURNING *
  `;
  return row || null;
}

export async function deleteEvent(id: string): Promise<boolean> {
  const result = await sql`
    UPDATE events SET is_deleted = TRUE, updated_at = NOW() WHERE id = ${id}
  `;
  return result.count > 0;
}
