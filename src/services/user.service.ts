import pool from "../config/db.config";
import { User, UserRow } from "../types/auth.types";
import { toUser } from "./auth.service";

export async function updateUser({
  name,
  role,
  userId,
}: {
  name?: string;
  role?: string;
  userId: string;
}): Promise<{ user: User; message: string }> {
  try {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (name) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name.trim());
    }

    if (role) {
      updates.push(`role = $${paramIndex++}`);
      values.push(role);
    }

    if (updates.length === 0) {
      throw new Error("No fields provided for update");
    }

    values.push(userId);
    const query = `UPDATE users SET ${updates.join(", ")}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING id, email, password_hash, name, google_id, email_verified_at, role, college_id, created_at, updated_at`;

    const result = await pool.query<UserRow>(query, values);
    return {
      user: toUser(result.rows[0]!),
      message: "User updated successfully",
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "User update failed";
    throw new Error(message);
  }
}

export const getAllUsers = async () => {
  try {
    const result = await pool.query<UserRow>(
      "SELECT id, email, name, email_verified_at, role, college_id, created_at, updated_at FROM users",
    );
    return result.rows.map(toUser);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to retrieve users";
    throw new Error(message);
  }
};

export const deleteUserById = async (userId: string) => {
  try {
    await pool.query(
      "UPDATE users SET is_deleted = TRUE, updated_at = NOW() WHERE id = $1",
      [userId],
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete user";
    throw new Error(message);
  }
};
