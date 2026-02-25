import sql from "../config/db.config";
import { logger } from "../logger/logger";
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
  logger.info({ eventId: data.event_id, userId: data.user_id }, "RegistrationService: createRegistration - Init");
  return await sql.begin(async (tx: any) => {
    // 1. Lock the event row and check capacity/deadline
    const [event] = await tx<any[]>`
      SELECT id, registration_deadline, max_participants, status, is_deleted
      FROM events
      WHERE id = ${data.event_id}
      FOR UPDATE
    `;

    if (!event || event.is_deleted) {
      throw new Error("Event not found");
    }

    if (event.status !== 'published') {
      throw new Error("Registration is only allowed for published events");
    }

    if (event.registration_deadline && new Date(event.registration_deadline) < new Date()) {
      throw new Error("Registration deadline has passed");
    }

    // 2. Check current registration count
    const [countRow] = await tx`
      SELECT COUNT(*) as count FROM event_registrations 
      WHERE event_id = ${data.event_id} AND status != 'cancelled'
    `;
    const currentCount = parseInt(countRow.count);

    if (event.max_participants && currentCount >= event.max_participants) {
      throw new Error("Event is already full");
    }

    // 3. Check if user is already registered
    const [existing] = await tx`
      SELECT id FROM event_registrations 
      WHERE event_id = ${data.event_id} AND user_id = ${data.user_id} AND status != 'cancelled'
    `;
    if (existing) {
      throw new Error("You are already registered for this event");
    }

    // 4. Create registration
    const ticketNumber = `TKT-${uuidv4().slice(0, 8).toUpperCase()}`;
    const [row] = await tx<Registration[]>`
      INSERT INTO event_registrations (event_id, user_id, ticket_number)
      VALUES (${data.event_id}, ${data.user_id}, ${ticketNumber})
      RETURNING *
    `;
    
    if (!row) throw new Error("Registration failed");
    logger.info({ registrationId: row.id }, "RegistrationService: createRegistration - Completion");
    return row;
  });
}

export async function getUserRegistrations(userId: string): Promise<Registration[]> {
  logger.info({ userId }, "RegistrationService: getUserRegistrations - Init");
  const registrations = await sql<Registration[]>`
    SELECT r.*, e.title as event_title, e.start_time, e.location
    FROM event_registrations r
    JOIN events e ON r.event_id = e.id
    WHERE r.user_id = ${userId}
    ORDER BY e.start_time DESC
  `;
  logger.info({ userId, count: registrations.length }, "RegistrationService: getUserRegistrations - Completion");
  return registrations;
}

export async function getEventRegistrations(eventId: string): Promise<any[]> {
  logger.info({ eventId }, "RegistrationService: getEventRegistrations - Init");
  const registrations = await sql<any[]>`
    SELECT r.*, u.name as user_name, u.email as user_email
    FROM event_registrations r
    JOIN users u ON r.user_id = u.id
    WHERE r.event_id = ${eventId}
  `;
  logger.info({ eventId, count: registrations.length }, "RegistrationService: getEventRegistrations - Completion");
  return registrations;
}

export async function cancelRegistration(id: string, userId: string): Promise<boolean> {
  logger.info({ registrationId: id, userId }, "RegistrationService: cancelRegistration - Init");
  const result = await sql`
    UPDATE event_registrations
    SET status = 'cancelled', updated_at = NOW()
    WHERE id = ${id} AND user_id = ${userId}
  `;
  const success = result.count > 0;
  logger.info({ registrationId: id, success }, "RegistrationService: cancelRegistration - Completion");
  return success;
}
