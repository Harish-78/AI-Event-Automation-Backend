import pool from "../config/db.config";
import type { EventRegistration } from "../types/entity.types";

export async function registerForEvent(
  eventId: string,
  userId: string
): Promise<EventRegistration> {
  // Check if event exists and is published
  const event = await pool.query(
    "SELECT id, status, max_participants, registration_deadline FROM events WHERE id = $1 AND is_deleted = FALSE",
    [eventId]
  );
  if (event.rows.length === 0) {
    throw new Error("Event not found");
  }

  const eventData = event.rows[0]!;

  if (eventData.status !== "published") {
    throw new Error("Event is not open for registration");
  }

  if (eventData.registration_deadline && new Date(eventData.registration_deadline) < new Date()) {
    throw new Error("Registration deadline has passed");
  }

  // Check max participants
  if (eventData.max_participants) {
    const count = await pool.query(
      "SELECT COUNT(*) FROM event_registrations WHERE event_id = $1 AND status = 'registered'",
      [eventId]
    );
    if (parseInt(count.rows[0]!.count, 10) >= eventData.max_participants) {
      throw new Error("Event is full");
    }
  }

  // Check if already registered
  const existing = await pool.query(
    "SELECT id, status FROM event_registrations WHERE event_id = $1 AND user_id = $2",
    [eventId, userId]
  );

  if (existing.rows.length > 0) {
    const reg = existing.rows[0]!;
    if (reg.status === "registered") {
      throw new Error("Already registered for this event");
    }
    // Re-register if previously cancelled
    const result = await pool.query<EventRegistration>(
      "UPDATE event_registrations SET status = 'registered', cancelled_at = NULL, registered_at = NOW() WHERE id = $1 RETURNING *",
      [reg.id]
    );
    return result.rows[0]!;
  }

  const result = await pool.query<EventRegistration>(
    "INSERT INTO event_registrations (event_id, user_id) VALUES ($1, $2) RETURNING *",
    [eventId, userId]
  );
  return result.rows[0]!;
}

export async function cancelRegistration(
  eventId: string,
  userId: string
): Promise<EventRegistration> {
  const result = await pool.query<EventRegistration>(
    "UPDATE event_registrations SET status = 'cancelled', cancelled_at = NOW() WHERE event_id = $1 AND user_id = $2 AND status = 'registered' RETURNING *",
    [eventId, userId]
  );
  if (result.rows.length === 0) {
    throw new Error("Registration not found");
  }
  return result.rows[0]!;
}

export async function getEventRegistrations(
  eventId: string
): Promise<{ registrations: any[]; total: number }> {
  const result = await pool.query(
    `SELECT er.*, u.name as user_name, u.email as user_email
     FROM event_registrations er
     JOIN users u ON er.user_id = u.id
     WHERE er.event_id = $1
     ORDER BY er.registered_at DESC`,
    [eventId]
  );

  return {
    registrations: result.rows,
    total: result.rows.length,
  };
}

export async function getUserRegistrations(
  userId: string
): Promise<any[]> {
  const result = await pool.query(
    `SELECT er.*, e.title as event_title, e.start_time, e.end_time, e.location, e.status as event_status, e.category,
            c.name as college_name
     FROM event_registrations er
     JOIN events e ON er.event_id = e.id
     LEFT JOIN colleges c ON e.college_id = c.id
     WHERE er.user_id = $1
     ORDER BY e.start_time ASC`,
    [userId]
  );
  return result.rows;
}

export async function checkUserRegistration(
  eventId: string,
  userId: string
): Promise<EventRegistration | null> {
  const result = await pool.query<EventRegistration>(
    "SELECT * FROM event_registrations WHERE event_id = $1 AND user_id = $2",
    [eventId, userId]
  );
  return result.rows[0] || null;
}
