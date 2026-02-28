import sql from "../config/db.config";
import { logger } from "../logger/logger";
import type { Event } from "../types/entity.types";

export async function createEvent(data: Partial<Event>): Promise<Event> {
  logger.info({ title: data.title, collegeId: data.college_id }, "EventService: createEvent - Init");
  const [row] = await sql<Event[]>`
    INSERT INTO events (
      title, description, college_id, department_id, category, 
      start_time, end_time, location, registration_deadline, 
      max_participants, created_by, status, is_global
    ) VALUES (
      ${data.title!}, ${data.description || null}, ${data.college_id!}, ${data.department_id || null}, ${data.category!},
      ${data.start_time!}, ${data.end_time!}, ${data.location || null}, ${data.registration_deadline || null},
      ${data.max_participants || null}, ${data.created_by!}, ${data.status || 'draft'}, ${data.is_global || false}
    )
    RETURNING *
  `;
  if (!row) throw new Error("Insert failed");
  logger.info({ eventId: row.id }, "EventService: createEvent - Completion");
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
  logger.info(params, "EventService: getAllEvents - Init");
  const { college_id, department_id, category, status, search, limit = 10, offset = 0 } = params;
  const conditions: any[] = [sql`e.is_deleted = FALSE`];

  if (college_id) {
    // If college_id is provided, show events from that college OR global events
    conditions.push(sql`(e.college_id = ${college_id} OR e.is_global = TRUE)`);
  }
  if (department_id) {
    conditions.push(sql`e.department_id = ${department_id}`);
  }
  if (category) {
    conditions.push(sql`e.category = ${category}`);
  }
  if (status) {
    conditions.push(sql`e.status = ${status}`);
  }
  if (search) {
    const searchTerm = `%${search.trim().toLowerCase()}%`;
    conditions.push(sql`(LOWER(e.title) LIKE ${searchTerm} OR LOWER(e.description) LIKE ${searchTerm})`);
  }

  const whereClause = conditions.length > 0 
    ? sql`WHERE ${conditions.reduce((acc, cond) => sql`${acc} AND ${cond}`)}` 
    : sql``;

  const [totalResult] = await sql<{ count: string }[]>`
    SELECT COUNT(*) FROM events e ${whereClause}
  `;
  const total = parseInt(totalResult!.count, 10);

  const events = await sql<Event[]>`
    SELECT e.*, 
           u1.name as created_by_name, 
           u2.name as updated_by_name
    FROM events e
    LEFT JOIN users u1 ON e.created_by = u1.id
    LEFT JOIN users u2 ON e.updated_by = u2.id
    ${whereClause} 
    ORDER BY e.start_time ASC 
    LIMIT ${limit} OFFSET ${offset}
  `;
  logger.info({ count: events.length, total }, "EventService: getAllEvents - Completion");
  return { events, total };
}

export async function getEventById(id: string): Promise<Event | null> {
  logger.info({ eventId: id }, "EventService: getEventById - Init");
  const [row] = await sql<Event[]>`
    SELECT * FROM events WHERE id = ${id} AND is_deleted = FALSE
  `;
  const result = row || null;
  logger.info({ eventId: id, found: !!result }, "EventService: getEventById - Completion");
  return result;
}

export async function updateEvent(id: string, data: Partial<Event>): Promise<Event | null> {
  logger.info({ eventId: id }, "EventService: updateEvent - Init");
  const updateData: any = { updated_at: sql`NOW()`, updated_by: (data as any).updated_by || null };
  const columns = ["updated_at", "updated_by"];

  const allowedFields = [
    "title", "description", "department_id", "category", 
    "start_time", "end_time", "location", "registration_deadline", 
    "max_participants", "status", "is_global"
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
      ${sql(updateData, columns)}
    WHERE id = ${id} AND is_deleted = FALSE 
    RETURNING *
  `;
  logger.info({ eventId: id, success: !!row }, "EventService: updateEvent - Completion");
  return row || null;
}

export async function deleteEvent(id: string): Promise<boolean> {
  logger.info({ eventId: id }, "EventService: deleteEvent - Init");
  const result = await sql`
    UPDATE events SET is_deleted = TRUE, updated_at = NOW() WHERE id = ${id}
  `;
  const success = result.count > 0;
  logger.info({ eventId: id, success }, "EventService: deleteEvent - Completion");
  return success;
}
