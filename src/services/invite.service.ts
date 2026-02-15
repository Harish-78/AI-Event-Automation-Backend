import { v4 as uuidv4 } from "uuid";
import pool from "../config/db.config";
import type { InviteToken } from "../types/auth.types";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const INVITE_EXPIRY_DAYS = 7;

export async function createInviteToken(
  createdBy: string,
  role: string,
  collegeId?: string
): Promise<{ invite: InviteToken; inviteUrl: string }> {
  if (!["admin", "superadmin"].includes(role)) {
    throw new Error("Invite role must be 'admin' or 'superadmin'");
  }

  if (role === "admin" && !collegeId) {
    throw new Error("College ID is required for admin invites");
  }

  // Verify college exists if provided
  if (collegeId) {
    const college = await pool.query(
      "SELECT id FROM colleges WHERE id = $1 AND is_deleted = FALSE",
      [collegeId]
    );
    if (college.rows.length === 0) {
      throw new Error("College not found");
    }
  }

  const token = uuidv4();
  const expiresAt = new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  const result = await pool.query<InviteToken>(
    `INSERT INTO invite_tokens (token, role, college_id, created_by, expires_at)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [token, role, collegeId || null, createdBy, expiresAt]
  );

  const invite = result.rows[0]!;
  const inviteUrl = `${FRONTEND_URL}/signup?invite=${token}`;

  return { invite, inviteUrl };
}

export async function validateInviteToken(
  token: string
): Promise<{ role: string; college_id: string | null; college_name?: string }> {
  const result = await pool.query<InviteToken & { college_name: string | null }>(
    `SELECT it.*, c.name as college_name
     FROM invite_tokens it 
     LEFT JOIN colleges c ON it.college_id = c.id
     WHERE it.token = $1`,
    [token]
  );

  if (result.rows.length === 0) {
    throw new Error("Invalid invite token");
  }

  const invite = result.rows[0]!;

  if (invite.used_at) {
    throw new Error("This invite has already been used");
  }

  if (new Date(invite.expires_at) < new Date()) {
    throw new Error("This invite has expired");
  }

  const ret: { role: string; college_id: string | null; college_name?: string } = {
    role: invite.role,
    college_id: invite.college_id,
  };
  if (invite.college_name) {
    ret.college_name = invite.college_name;
  }
  return ret;
}

export async function consumeInviteToken(
  token: string,
  userId: string
): Promise<void> {
  await pool.query(
    "UPDATE invite_tokens SET used_at = NOW(), used_by = $1 WHERE token = $2",
    [userId, token]
  );
}

export async function getInviteTokens(
  createdBy?: string
): Promise<InviteToken[]> {
  let query = `
    SELECT it.*, c.name as college_name 
    FROM invite_tokens it
    LEFT JOIN colleges c ON it.college_id = c.id
  `;
  const values: any[] = [];

  if (createdBy) {
    query += " WHERE it.created_by = $1";
    values.push(createdBy);
  }

  query += " ORDER BY it.created_at DESC";

  const result = await pool.query<InviteToken>(query, values);
  return result.rows;
}

export async function deleteInviteToken(id: string): Promise<boolean> {
  const result = await pool.query(
    "DELETE FROM invite_tokens WHERE id = $1 AND used_at IS NULL",
    [id]
  );
  return (result.rowCount ?? 0) > 0;
}
