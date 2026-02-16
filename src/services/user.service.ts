import sql from "../config/db.config";
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

    const [row] = await sql<UserRow[]>`
      UPDATE users SET 
        ${sql(updateData, columns)}
      WHERE id = ${userId}
      RETURNING id, email, password_hash, name, google_id, email_verified_at, role, college_id, created_at, updated_at
    `;

    if (!row) throw new Error("User not found or update failed");

    return {
      user: toUser(row),
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
    const users = await sql<UserRow[]>`
      SELECT id, email, name, email_verified_at, role, college_id, created_at, updated_at FROM users
    `;
    return users.map(toUser);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to retrieve users";
    throw new Error(message);
  }
};

export const deleteUserById = async (userId: string) => {
  try {
    await sql`
      UPDATE users SET is_deleted = TRUE, updated_at = NOW() WHERE id = ${userId}
    `;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete user";
    throw new Error(message);
  }
};
