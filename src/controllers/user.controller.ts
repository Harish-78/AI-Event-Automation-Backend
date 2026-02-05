import { Request, Response } from "express";
import {
  deleteUserById,
  getAllUsers,
  updateUser,
} from "../services/user.service";

export async function getProfile(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json({ user: req.user });
}

export async function updateProfile(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  try {
    const { id, name, role } = req.body;
    const isSuperAdmin = req.user.role === "superadmin";

    // Target user ID is either the provided ID (if Super Admin) or the current user's ID
    const targetUserId = (isSuperAdmin && id) ? id : req.user.id;

    // Security checks
    if (id && id !== req.user.id && !isSuperAdmin) {
      res.status(403).json({ error: "Forbidden: Only Super Admins can update other users" });
      return;
    }

    if (role && !isSuperAdmin) {
      res.status(403).json({ error: "Forbidden: Only Super Admins can update roles" });
      return;
    }

    if (!name && !role) {
      res.status(400).json({ error: "Name or role is required" });
      return;
    }

    const { user: updatedUser, message } = await updateUser({
      name,
      role,
      userId: targetUserId,
    });

    res.json({ user: updatedUser, message });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Profile update failed";
    res.status(400).json({ error: message });
  }
}

export async function getAllProfiles(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  if (req.user.role !== "admin" && req.user.role !== "superadmin") {
    res.status(403).json({ error: "Forbidden: Admins only" });
    return;
  }
  try {
    const users = await getAllUsers();
    res.json({ users });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to retrieve users";
    res.status(500).json({ error: message });
  }
}

export async function deleteUser(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  if (req.user.role !== "superadmin") {
    res.status(403).json({ error: "Forbidden: Superadmins only" });
    return;
  }
  try {
    const userIdParam = req.params.id;
    const userId = Array.isArray(userIdParam) ? userIdParam[0] : userIdParam;
    if (!userId) {
      res.status(400).json({ error: "User ID is required" });
      return;
    }
    await deleteUserById(userId);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete user";
    res.status(500).json({ error: message });
  }
}
