import pool from "../config/db.config";
import { v4 as uuidv4 } from "uuid";

export interface Registration {
  id: string;
  event_id: string;
  user_id: string;
  status: 'registered' | 'attended' | 'cancelled';
  ticket_number: string;
  created_at: Date;
  updated_at: Date;
}

export async function createRegistration(data: { event_id: string, user_id: string }): Promise<Registration> {
  const ticketNumber = `TKT-${uuidv4().slice(0, 8).toUpperCase()}`;
  const result = await pool.query(
    `INSERT INTO event_registrations (event_id, user_id, ticket_number)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [data.event_id, data.user_id, ticketNumber]
  );
  return result.rows[0];
}

export async function getUserRegistrations(userId: string): Promise<Registration[]> {
  const result = await pool.query(
    `SELECT r.*, e.title as event_title, e.start_time, e.location
     FROM event_registrations r
     JOIN events e ON r.event_id = e.id
     WHERE r.user_id = $1
     ORDER BY e.start_time DESC`,
    [userId]
  );
  return result.rows;
}

export async function getEventRegistrations(eventId: string): Promise<any[]> {
  const result = await pool.query(
    `SELECT r.*, u.name as user_name, u.email as user_email
     FROM event_registrations r
     JOIN users u ON r.user_id = u.id
     WHERE r.event_id = $1`,
    [eventId]
  );
  return result.rows;
}

export async function cancelRegistration(id: string, userId: string): Promise<boolean> {
  const result = await pool.query(
    `UPDATE event_registrations
     SET status = 'cancelled', updated_at = NOW()
     WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  return (result.rowCount ?? 0) > 0;
}
