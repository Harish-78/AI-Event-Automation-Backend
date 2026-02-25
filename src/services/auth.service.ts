import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import sql from "../config/db.config";
import { logger } from "../logger/logger";
import type { User, UserRow } from "../types/auth.types";
import { sendVerificationEmail } from "./email.service";

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

function signToken(payload: { sub: string; email: string; role: string }): string {
  return jwt.sign(payload, JWT_SECRET as string, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const VERIFICATION_EXPIRY_HOURS = 24;

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
  name: string
): Promise<{ user: User; message: string }> {
  logger.info({ email }, "AuthService: register - Init");
  const [existing] = await sql<UserRow[]>`
    SELECT id FROM users WHERE email = ${email.toLowerCase()}
  `;
  if (existing) {
    throw new Error("Email already registered");
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const [row0] = await sql<UserRow[]>`
    INSERT INTO users (email, password_hash, name, role)
    VALUES (${email.toLowerCase()}, ${passwordHash}, ${name || null}, 'user')
    RETURNING id, email, password_hash, name, google_id, email_verified_at, role, created_at, updated_at
  `;
  if (!row0) throw new Error("Insert failed");
  const user = toUser(row0);
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000);
  await sql`
    INSERT INTO email_verification_tokens (user_id, token, expires_at) 
    VALUES (${user.id}, ${token}, ${expiresAt})
  `;
  const verificationUrl = `${FRONTEND_URL}/verify-email?token=${token}`;
  await sendVerificationEmail(user.email, user.name || "User", verificationUrl);
  logger.info({ userId: user.id }, "AuthService: register - Completion");
  return { user, message: "Registration successful. Please check your email to verify your account." };
}

export async function login(
  email: string,
  password: string
): Promise<{ user: User; accessToken: string }> {
  logger.info({ email }, "AuthService: login - Init");
  const [row] = await sql<UserRow[]>`
    SELECT id, email, password_hash, name, google_id, email_verified_at, role, created_at, updated_at 
    FROM users WHERE email = ${email.toLowerCase()}
  `;
  if (!row) {
    throw new Error("Invalid email or password");
  }
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
  const accessToken = signToken({ sub: user.id, email: user.email, role: user.role });
  logger.info({ userId: user.id }, "AuthService: login - Completion");
  return { user, accessToken };
}

export async function verifyEmail(token: string): Promise<{ user: User; accessToken: string }> {
  logger.info("AuthService: verifyEmail - Init");
  const [tokenData] = await sql<{ user_id: string; expires_at: string }[]>`
    SELECT user_id, expires_at FROM email_verification_tokens WHERE token = ${token}
  `;
  if (!tokenData) {
    throw new Error("Invalid or expired verification token");
  }
  const { user_id, expires_at } = tokenData;
  if (new Date(tokenData.expires_at) < new Date()) {
    await sql`DELETE FROM email_verification_tokens WHERE token = ${token}`;
    throw new Error("Verification token has expired");
  }
  await sql`UPDATE users SET email_verified_at = NOW(), updated_at = NOW() WHERE id = ${user_id}`;
  await sql`DELETE FROM email_verification_tokens WHERE token = ${token}`;
  const [userRow] = await sql<UserRow[]>`
    SELECT id, email, password_hash, name, google_id, email_verified_at, role, created_at, updated_at 
    FROM users WHERE id = ${user_id}
  `;
  if (!userRow) throw new Error("User not found");
  const user = toUser(userRow);
  const accessToken = signToken({ sub: user.id, email: user.email, role: user.role });
  logger.info({ userId: user.id }, "AuthService: verifyEmail - Completion");
  return { user, accessToken };
}

export async function resendVerificationEmail(email: string): Promise<{ message: string }> {
  logger.info({ email }, "AuthService: resendVerificationEmail - Init");
  const [row] = await sql<UserRow[]>`
    SELECT id, email, name, email_verified_at FROM users WHERE email = ${email.toLowerCase()}
  `;
  if (!row) {
    throw new Error("No account found with this email");
  }
  if (row.email_verified_at) {
    throw new Error("Email is already verified. You can log in.");
  }
  await sql`DELETE FROM email_verification_tokens WHERE user_id = ${row.id}`;
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000);
  await sql`
    INSERT INTO email_verification_tokens (user_id, token, expires_at) 
    VALUES (${row.id}, ${token}, ${expiresAt})
  `;
  const verificationUrl = `${FRONTEND_URL}/verify-email?token=${token}`;
  await sendVerificationEmail(row.email, row.name || "User", verificationUrl);
  logger.info({ email }, "AuthService: resendVerificationEmail - Completion");
  return { message: "Verification email sent. Please check your inbox." };
}

export async function findOrCreateGoogleUser(
  googleId: string,
  email: string,
  name: string
): Promise<{ user: User; accessToken: string }> {
  logger.info({ email, googleId }, "AuthService: findOrCreateGoogleUser - Init");
  const [existingUser] = await sql<UserRow[]>`
    SELECT id, email, password_hash, name, google_id, email_verified_at, role, created_at, updated_at 
    FROM users WHERE google_id = ${googleId}
  `;
  if (existingUser) {
    const user = toUser(existingUser);
    const accessToken = signToken({ sub: user.id, email: user.email, role: user.role });
    logger.info({ userId: user.id }, "AuthService: findOrCreateGoogleUser - Completion");
    return { user, accessToken };
  }
  const [existingEmailUser] = await sql<UserRow[]>`
    SELECT id, email, password_hash, name, google_id, email_verified_at, role, created_at, updated_at 
    FROM users WHERE email = ${email.toLowerCase()}
  `;
  if (existingEmailUser) {
    await sql`
      UPDATE users SET 
        google_id = ${googleId}, 
        email_verified_at = COALESCE(email_verified_at, NOW()), 
        updated_at = NOW(), 
        name = COALESCE(name, ${name || null}) 
      WHERE id = ${existingEmailUser.id}
    `;
    const [updatedRow] = await sql<UserRow[]>`
      SELECT id, email, password_hash, name, google_id, email_verified_at, role, created_at, updated_at 
      FROM users WHERE id = ${existingEmailUser.id}
    `;
    if (!updatedRow) throw new Error("User not found");
    const user = toUser(updatedRow);
    const accessToken = signToken({ sub: user.id, email: user.email, role: user.role });
    logger.info({ userId: user.id }, "AuthService: findOrCreateGoogleUser - Completion");
    return { user, accessToken };
  }
  const [insertRow] = await sql<UserRow[]>`
    INSERT INTO users (email, google_id, name, email_verified_at, role)
    VALUES (${email.toLowerCase()}, ${googleId}, ${name || null}, NOW(), 'user')
    RETURNING id, email, password_hash, name, google_id, email_verified_at, role, created_at, updated_at
  `;
  if (!insertRow) throw new Error("Insert failed");
  const user = toUser(insertRow);
  const accessToken = signToken({ sub: user.id, email: user.email, role: user.role });
  logger.info({ userId: user.id, email: user.email }, "New user created via Google");
  logger.info({ userId: user.id }, "AuthService: findOrCreateGoogleUser - Completion");
  return { user, accessToken };
}

export function createTokenForUser(user: User): string {
  return signToken({ sub: user.id, email: user.email, role: user.role });
}

export async function getUserById(id: string): Promise<User | null> {
  logger.info({ userId: id }, "AuthService: getUserById - Init");
  const [row] = await sql<UserRow[]>`
    SELECT id, email, password_hash, name, google_id, email_verified_at, role, created_at, updated_at 
    FROM users WHERE id = ${id}
  `;
  const result = row ? toUser(row) : null;
  logger.info({ userId: id, found: !!result }, "AuthService: getUserById - Completion");
  return result;
}
