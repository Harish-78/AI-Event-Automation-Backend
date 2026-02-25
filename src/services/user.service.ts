import sql from "../config/db.config";
import { logger } from "../logger/logger";
import { User, UserRow } from "../types/auth.types";
import { toUser } from "./auth.service";

export async function updateUser({
  name,
  role,
  college_id,
  userId,
}: {
  name?: string;
  role?: string;
  college_id?: string | null;
  userId: string;
}): Promise<{ user: User; message: string }> {
  logger.info({ userId }, "UserService: updateUser - Init");
  try {
    const updateData: any = { updated_at: sql`NOW()` };
    const columns = ["updated_at"];

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
      WHERE id = ${userId}
      RETURNING id, email, password_hash, name, google_id, email_verified_at, role, college_id, created_at, updated_at
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

export const getAllUsers = async () => {
  logger.info("UserService: getAllUsers - Init");
  try {
    const users = await sql<UserRow[]>`
      SELECT id, email, name, email_verified_at, role, college_id, created_at, updated_at FROM users
    `;
    const result = users.map(toUser);
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
