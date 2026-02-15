import { Request, Response } from "express";
import * as departmentService from "../services/department.service";
import { AuthRequest } from "../middleware/auth.middleware";

export async function createDepartment(req: Request, res: Response): Promise<void> {
  try {
    const authReq = req as AuthRequest;
    const { role, college_id: userCollegeId } = authReq.user!;

    // If admin, force their own college_id
    if (role === "admin") {
      req.body.college_id = userCollegeId;
    }

    const department = await departmentService.createDepartment(req.body);
    res.status(201).json({ department, message: "Department created successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create department";
    res.status(400).json({ error: message });
  }
}

export async function getAllDepartments(req: Request, res: Response): Promise<void> {
  try {
    const authReq = req as AuthRequest;
    const { role, college_id: userCollegeId } = authReq.user!;
    
    let { college_id, search, limit, offset } = req.query;

    // If admin, strictly filter by their own college_id
    if (role === "admin") {
      college_id = userCollegeId as string;
    }

    const result = await departmentService.getAllDepartments({
      college_id: college_id as string,
      search: search as string,
      limit: limit ? parseInt(limit as string, 10) : 10,
      offset: offset ? parseInt(offset as string, 10) : 0,
    });
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to retrieve departments";
    res.status(500).json({ error: message });
  }
}

export async function getDepartmentById(req: Request, res: Response): Promise<void> {
  try {
    const authReq = req as AuthRequest;
    const { role, college_id: userCollegeId } = authReq.user!;
    const { id: rawId } = req.params;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!id) {
      res.status(400).json({ error: "Department ID is required" });
      return;
    }

    const department = await departmentService.getDepartmentById(id);
    if (!department) {
      res.status(404).json({ error: "Department not found" });
      return;
    }

    // Role check: admin can only see their own college's departments
    if (role === "admin" && department.college_id !== userCollegeId) {
      res.status(403).json({ error: "Forbidden: Department belongs to another college" });
      return;
    }

    res.json({ department });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to retrieve department";
    res.status(500).json({ error: message });
  }
}

export async function updateDepartment(req: Request, res: Response): Promise<void> {
  try {
    const authReq = req as AuthRequest;
    const { role, college_id: userCollegeId } = authReq.user!;
    const { id: rawId } = req.params;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!id) {
      res.status(400).json({ error: "Department ID is required" });
      return;
    }

    const existing = await departmentService.getDepartmentById(id);
    if (!existing) {
      res.status(404).json({ error: "Department not found" });
      return;
    }

    if (role === "admin" && existing.college_id !== userCollegeId) {
      res.status(403).json({ error: "Forbidden: Department belongs to another college" });
      return;
    }

    // Admins cannot change the college_id
    if (role === "admin") {
      delete req.body.college_id;
    }

    const department = await departmentService.updateDepartment(id, req.body);
    res.json({ department, message: "Department updated successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update department";
    res.status(400).json({ error: message });
  }
}

export async function deleteDepartment(req: Request, res: Response): Promise<void> {
  try {
    const authReq = req as AuthRequest;
    const { role, college_id: userCollegeId } = authReq.user!;
    const { id: rawId } = req.params;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!id) {
      res.status(400).json({ error: "Department ID is required" });
      return;
    }

    const existing = await departmentService.getDepartmentById(id);
    if (!existing) {
      res.status(404).json({ error: "Department not found" });
      return;
    }

    if (role === "admin" && existing.college_id !== userCollegeId) {
      res.status(403).json({ error: "Forbidden: Department belongs to another college" });
      return;
    }

    await departmentService.deleteDepartment(id);
    res.json({ message: "Department deleted successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete department";
    res.status(500).json({ error: message });
  }
}
