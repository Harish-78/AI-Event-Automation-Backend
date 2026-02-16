import sql from "../config/db.config";
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
  const [row] = await sql<Registration[]>`
    INSERT INTO event_registrations (event_id, user_id, ticket_number)
    VALUES (${data.event_id}, ${data.user_id}, ${ticketNumber})
    RETURNING *
  `;
  if (!row) throw new Error("Insert failed");
  return row;
}

export async function getUserRegistrations(userId: string): Promise<Registration[]> {
  const registrations = await sql<Registration[]>`
    SELECT r.*, e.title as event_title, e.start_time, e.location
    FROM event_registrations r
    JOIN events e ON r.event_id = e.id
    WHERE r.user_id = ${userId}
    ORDER BY e.start_time DESC
  `;
  return registrations;
}

export async function getEventRegistrations(eventId: string): Promise<any[]> {
  const registrations = await sql<any[]>`
    SELECT r.*, u.name as user_name, u.email as user_email
    FROM event_registrations r
    JOIN users u ON r.user_id = u.id
    WHERE r.event_id = ${eventId}
  `;
  return registrations;
}

export async function cancelRegistration(id: string, userId: string): Promise<boolean> {
  const result = await sql`
    UPDATE event_registrations
    SET status = 'cancelled', updated_at = NOW()
    WHERE id = ${id} AND user_id = ${userId}
  `;
  return result.count > 0;
}
