import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import pool from "../config/db.config";
import { logger } from "../logger/logger";
import type { User, UserRow } from "../types/auth.types";
import { sendVerificationEmail } from "./email.service";
<<<<<<< HEAD
import { validateInviteToken, consumeInviteToken } from "./invite.service";
=======
>>>>>>> origin/main

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

<<<<<<< HEAD
function signToken(payload: { sub: string; email: string; role: string; college_id?: string | null }): string {
=======
function signToken(payload: { sub: string; email: string; role: string }): string {
>>>>>>> origin/main
  return jwt.sign(payload, JWT_SECRET as string, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const VERIFICATION_EXPIRY_HOURS = 24;

<<<<<<< HEAD
const USER_COLUMNS = "id, email, password_hash, name, google_id, email_verified_at, role, college_id, created_at, updated_at";

=======
>>>>>>> origin/main
export function toUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    google_id: row.google_id,
    email_verified_at: row.email_verified_at,
    role: row.role,
    college_id: row.college_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function register(
  email: string,
  password: string,
<<<<<<< HEAD
  name: string,
  inviteToken?: string
=======
  name: string
>>>>>>> origin/main
): Promise<{ user: User; message: string }> {
  const existing = await pool.query<UserRow>(
    "SELECT id FROM users WHERE email = $1",
    [email.toLowerCase()]
  );
  if (existing.rows.length > 0) {
    throw new Error("Email already registered");
  }
<<<<<<< HEAD

  // Determine role and college_id from invite token
  let role = "user";
  let collegeId: string | null = null;

  if (inviteToken) {
    const invite = await validateInviteToken(inviteToken);
    role = invite.role;
    collegeId = invite.college_id;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const result = await pool.query<UserRow>(
    `INSERT INTO users (email, password_hash, name, role, college_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${USER_COLUMNS}`,
    [email.toLowerCase(), passwordHash, name || null, role, collegeId]
=======
  const passwordHash = await bcrypt.hash(password, 12);
  const result = await pool.query<UserRow>(
    `INSERT INTO users (email, password_hash, name, role)
     VALUES ($1, $2, $3, 'user')
     RETURNING id, email, password_hash, name, google_id, email_verified_at, role, created_at, updated_at`,
    [email.toLowerCase(), passwordHash, name || null]
>>>>>>> origin/main
  );
  const row0 = result.rows[0];
  if (!row0) throw new Error("Insert failed");
  const user = toUser(row0);
<<<<<<< HEAD

  // Consume invite token after successful user creation
  if (inviteToken) {
    await consumeInviteToken(inviteToken, user.id);
  }

=======
>>>>>>> origin/main
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000);
  await pool.query(
    "INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)",
    [user.id, token, expiresAt]
  );
  const verificationUrl = `${FRONTEND_URL}/verify-email?token=${token}`;
  await sendVerificationEmail(user.email, user.name || "User", verificationUrl);
  return { user, message: "Registration successful. Please check your email to verify your account." };
}

export async function login(
  email: string,
  password: string
): Promise<{ user: User; accessToken: string }> {
  const result = await pool.query<UserRow>(
<<<<<<< HEAD
    `SELECT ${USER_COLUMNS} FROM users WHERE email = $1`,
=======
    "SELECT id, email, password_hash, name, google_id, email_verified_at, role, created_at, updated_at FROM users WHERE email = $1",
>>>>>>> origin/main
    [email.toLowerCase()]
  );
  if (result.rows.length === 0) {
    throw new Error("Invalid email or password");
  }
  const row = result.rows[0]!;
  if (!row.password_hash) {
    throw new Error("This account uses Google login. Please sign in with Google.");
  }
  if (!row.email_verified_at) {
    throw new Error("Please verify your email before logging in. Check your inbox for the verification link.");
  }
  const valid = await bcrypt.compare(password, row.password_hash);
  if (!valid) {
    throw new Error("Invalid email or password");
  }
  const user = toUser(row);
<<<<<<< HEAD
  const accessToken = signToken({ sub: user.id, email: user.email, role: user.role, college_id: user.college_id });
=======
  const accessToken = signToken({ sub: user.id, email: user.email, role: user.role });
>>>>>>> origin/main
  return { user, accessToken };
}

export async function verifyEmail(token: string): Promise<{ user: User; accessToken: string }> {
  const tokenRow = await pool.query<{ user_id: string; expires_at: string }>(
    "SELECT user_id, expires_at FROM email_verification_tokens WHERE token = $1",
    [token]
  );
  if (tokenRow.rows.length === 0) {
    throw new Error("Invalid or expired verification token");
  }
  const tokenData = tokenRow.rows[0]!;
  const { user_id, expires_at } = tokenData;
  if (new Date(expires_at) < new Date()) {
    await pool.query("DELETE FROM email_verification_tokens WHERE token = $1", [token]);
    throw new Error("Verification token has expired");
  }
  await pool.query("UPDATE users SET email_verified_at = NOW(), updated_at = NOW() WHERE id = $1", [user_id]);
  await pool.query("DELETE FROM email_verification_tokens WHERE token = $1", [token]);
  const userResult = await pool.query<UserRow>(
<<<<<<< HEAD
    `SELECT ${USER_COLUMNS} FROM users WHERE id = $1`,
=======
    "SELECT id, email, password_hash, name, google_id, email_verified_at, role, created_at, updated_at FROM users WHERE id = $1",
>>>>>>> origin/main
    [user_id]
  );
  const userRow = userResult.rows[0];
  if (!userRow) throw new Error("User not found");
  const user = toUser(userRow);
<<<<<<< HEAD
  const accessToken = signToken({ sub: user.id, email: user.email, role: user.role, college_id: user.college_id });
=======
  const accessToken = signToken({ sub: user.id, email: user.email, role: user.role });
>>>>>>> origin/main
  return { user, accessToken };
}

export async function resendVerificationEmail(email: string): Promise<{ message: string }> {
  const result = await pool.query<UserRow>(
    "SELECT id, email, name, email_verified_at FROM users WHERE email = $1",
    [email.toLowerCase()]
  );
  if (result.rows.length === 0) {
    throw new Error("No account found with this email");
  }
  const row = result.rows[0]!;
  if (row.email_verified_at) {
    throw new Error("Email is already verified. You can log in.");
  }
  await pool.query("DELETE FROM email_verification_tokens WHERE user_id = $1", [row.id]);
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000);
  await pool.query(
    "INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)",
    [row.id, token, expiresAt]
  );
  const verificationUrl = `${FRONTEND_URL}/verify-email?token=${token}`;
  await sendVerificationEmail(row.email, row.name || "User", verificationUrl);
  return { message: "Verification email sent. Please check your inbox." };
}

export async function findOrCreateGoogleUser(
  googleId: string,
  email: string,
  name: string
): Promise<{ user: User; accessToken: string }> {
  let result = await pool.query<UserRow>(
<<<<<<< HEAD
    `SELECT ${USER_COLUMNS} FROM users WHERE google_id = $1`,
=======
    "SELECT id, email, password_hash, name, google_id, email_verified_at, role, created_at, updated_at FROM users WHERE google_id = $1",
>>>>>>> origin/main
    [googleId]
  );
  if (result.rows.length > 0) {
    const user = toUser(result.rows[0]!);
<<<<<<< HEAD
    const accessToken = signToken({ sub: user.id, email: user.email, role: user.role, college_id: user.college_id });
    return { user, accessToken };
  }
  result = await pool.query<UserRow>(
    `SELECT ${USER_COLUMNS} FROM users WHERE email = $1`,
=======
    const accessToken = signToken({ sub: user.id, email: user.email, role: user.role });
    return { user, accessToken };
  }
  result = await pool.query<UserRow>(
    "SELECT id, email, password_hash, name, google_id, email_verified_at, role, created_at, updated_at FROM users WHERE email = $1",
>>>>>>> origin/main
    [email.toLowerCase()]
  );
  if (result.rows.length > 0) {
    const existingRow = result.rows[0]!;
    await pool.query(
      "UPDATE users SET google_id = $1, email_verified_at = COALESCE(email_verified_at, NOW()), updated_at = NOW(), name = COALESCE(name, $2) WHERE id = $3",
      [googleId, name || null, existingRow.id]
    );
    const updated = await pool.query<UserRow>(
<<<<<<< HEAD
      `SELECT ${USER_COLUMNS} FROM users WHERE id = $1`,
=======
      "SELECT id, email, password_hash, name, google_id, email_verified_at, role, created_at, updated_at FROM users WHERE id = $1",
>>>>>>> origin/main
      [existingRow.id]
    );
    const updatedRow = updated.rows[0];
    if (!updatedRow) throw new Error("User not found");
    const user = toUser(updatedRow);
<<<<<<< HEAD
    const accessToken = signToken({ sub: user.id, email: user.email, role: user.role, college_id: user.college_id });
=======
    const accessToken = signToken({ sub: user.id, email: user.email, role: user.role });
>>>>>>> origin/main
    return { user, accessToken };
  }
  const insert = await pool.query<UserRow>(
    `INSERT INTO users (email, google_id, name, email_verified_at, role)
     VALUES ($1, $2, $3, NOW(), 'user')
<<<<<<< HEAD
     RETURNING ${USER_COLUMNS}`,
=======
     RETURNING id, email, password_hash, name, google_id, email_verified_at, role, created_at, updated_at`,
>>>>>>> origin/main
    [email.toLowerCase(), googleId, name || null]
  );
  const insertRow = insert.rows[0];
  if (!insertRow) throw new Error("Insert failed");
  const user = toUser(insertRow);
<<<<<<< HEAD
  const accessToken = signToken({ sub: user.id, email: user.email, role: user.role, college_id: user.college_id });
=======
  const accessToken = signToken({ sub: user.id, email: user.email, role: user.role });
>>>>>>> origin/main
  logger.info({ userId: user.id, email: user.email }, "New user created via Google");
  return { user, accessToken };
}

export function createTokenForUser(user: User): string {
<<<<<<< HEAD
  return signToken({ sub: user.id, email: user.email, role: user.role, college_id: user.college_id });
=======
  return signToken({ sub: user.id, email: user.email, role: user.role });
>>>>>>> origin/main
}

export async function getUserById(id: string): Promise<User | null> {
  const result = await pool.query<UserRow>(
<<<<<<< HEAD
    `SELECT ${USER_COLUMNS} FROM users WHERE id = $1`,
=======
    "SELECT id, email, password_hash, name, google_id, email_verified_at, role, created_at, updated_at FROM users WHERE id = $1",
>>>>>>> origin/main
    [id]
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return row ? toUser(row) : null;
}
