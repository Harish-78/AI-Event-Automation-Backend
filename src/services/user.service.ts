import sql from "../config/db.config";
import bcrypt from "bcryptjs";
import { logger } from "../logger/logger";
import { User, UserRow } from "../types/auth.types";
import { toUser } from "./auth.service";

export async function createUser({
  email,
  password,
  name,
  role = "user",
  college_id,
  created_by,
}: {
  email: string;
  password?: string;
  name: string;
  role?: string;
  college_id?: string | null;
  created_by?: string | null;
}): Promise<User> {
  logger.info({ email, role }, "UserService: createUser - Init");
  
  const [existing] = await sql<UserRow[]>`
    SELECT id FROM users WHERE email = ${email.toLowerCase()}
  `;
  if (existing) {
    throw new Error("Email already registered");
  }

  const passwordHash = password ? await bcrypt.hash(password, 12) : null;
  
  const [row] = await sql<UserRow[]>`
    INSERT INTO users (email, password_hash, name, role, college_id, email_verified_at, created_by)
    VALUES (${email.toLowerCase()}, ${passwordHash}, ${name}, ${role}, ${college_id || null}, NOW(), ${created_by || null})
    RETURNING *,
      (SELECT name FROM users WHERE id = created_by) as created_by_name
  `;

  if (!row) throw new Error("Failed to create user");
  
  logger.info({ userId: row.id }, "UserService: createUser - Completion");
  return toUser(row);
}

export async function updateUser({
  name,
  role,
  college_id,
  userId,
  updatedBy,
}: {
  name?: string;
  role?: string;
  college_id?: string | null;
  userId: string;
  updatedBy?: string | null;
}): Promise<{ user: User; message: string }> {
  logger.info({ userId }, "UserService: updateUser - Init");
  try {
    const updateData: any = { updated_at: sql`NOW()`, updated_by: updatedBy || null };
    const columns = ["updated_at", "updated_by"];

    if (name) {
      updateData.name = name.trim();
      columns.push("name");
    }
    if (role) {
      updateData.role = role;
      columns.push("role");
    }
    if (college_id !== undefined) {
      updateData.college_id = college_id;
      columns.push("college_id");
    }

    const [row] = await sql<UserRow[]>`
      UPDATE users SET 
        ${sql(updateData, columns)}
      WHERE id = ${userId} AND is_deleted = FALSE
      RETURNING *,
        (SELECT name FROM users WHERE id = created_by) as created_by_name,
        (SELECT name FROM users WHERE id = updated_by) as updated_by_name
    `;

    if (!row) throw new Error("User not found or update failed");

    const result = {
      user: toUser(row),
      message: "User updated successfully",
    };
    logger.info({ userId }, "UserService: updateUser - Completion");
    return result;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "User update failed";
    throw new Error(message);
  }
}

export const getAllUsers = async (params?: { college_id?: string }) => {
  logger.info(params, "UserService: getAllUsers - Init");
  try {
    let query = sql`
      SELECT u.*, 
             u1.name as created_by_name, 
             u2.name as updated_by_name
      FROM users u
      LEFT JOIN users u1 ON u.created_by = u1.id
      LEFT JOIN users u2 ON u.updated_by = u2.id
      WHERE u.is_deleted = FALSE
    `;

    if (params?.college_id) {
      query = sql`${query} AND u.college_id = ${params.college_id}`;
    }

    const users = await query;
    const result = (users as any[]).map((u: any) => toUser(u as UserRow));
    logger.info({ count: result.length }, "UserService: getAllUsers - Completion");
    return result;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to retrieve users";
    throw new Error(message);
  }
};

export const deleteUserById = async (userId: string) => {
  logger.info({ userId }, "UserService: deleteUserById - Init");
  try {
    await sql`
      UPDATE users SET is_deleted = TRUE, updated_at = NOW() WHERE id = ${userId}
    `;
    logger.info({ userId }, "UserService: deleteUserById - Completion");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete user";
    throw new Error(message);
  }
};
