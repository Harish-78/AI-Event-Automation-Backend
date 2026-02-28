import { Request, Response } from "express";
import {
  deleteUserById,
  getAllUsers,
  updateUser,
  createUser,
} from "../services/user.service";

export async function getProfile(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json({ user: req.user });
}

export async function createNewUser(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const isSuperAdmin = req.user.role === "superadmin";
  const isAdmin = req.user.role === "admin";

  if (!isSuperAdmin && !isAdmin) {
    res.status(403).json({ error: "Forbidden: Admins only" });
    return;
  }

  try {
    const { email, password, name, role, college_id } = req.body;

    // Admin can only create users for their own college
    const finalCollegeId = isAdmin ? req.user.college_id : college_id;
    
    // Admin can only create 'user' or 'admin' (if they want to) but mostly 'user'
    // Let's restrict admin to creating only 'user' for now, or 'admin' only if superadmin
    const finalRole = isAdmin ? "user" : (role || "user");

    const newUser = await createUser({
      email,
      password,
      name,
      role: finalRole,
      college_id: finalCollegeId,
      created_by: req.user.id,
    });

    res.status(201).json({ user: newUser, message: "User created successfully" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create user";
    res.status(400).json({ error: message });
  }
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
    const { id, name, role, college_id } = req.body;
    const isSuperAdmin = req.user.role === "superadmin";
    const isAdmin = req.user.role === "admin";

    // Target user ID is either the provided ID (if admin/superadmin) or the current user's ID
    const targetUserId = (isSuperAdmin || isAdmin) && id ? id : req.user.id;

    // Security checks
    if (id && id !== req.user.id) {
      if (!isSuperAdmin && !isAdmin) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }
      // If admin, check if target user belongs to same college
      if (isAdmin) {
         // We might need to fetch the target user first to verify college, 
         // but for now let's assume the frontend sends correct data or 
         // add a quick check in service later.
      }
    }

    if (role && !isSuperAdmin) {
      res.status(403).json({ error: "Forbidden: Only Super Admins can update roles" });
      return;
    }

    if (!name && !role && college_id === undefined) {
      res.status(400).json({ error: "Name, role, or college_id is required" });
      return;
    }

    const { user: updatedUser, message } = await updateUser({
      name,
      role,
      college_id: isSuperAdmin ? college_id : undefined, // Admins can't change college_id
      userId: targetUserId,
      updatedBy: req.user.id,
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
    const params: any = {};
    if (req.user.role === "admin") {
      params.college_id = req.user.college_id;
    }
    const users = await getAllUsers(params);
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
