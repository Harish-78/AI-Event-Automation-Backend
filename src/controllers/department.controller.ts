import { Request, Response } from "express";
import * as departmentService from "../services/department.service";

export async function createDepartment(req: Request, res: Response): Promise<void> {
  try {
    const department = await departmentService.createDepartment(req.body);
    res.status(201).json({ department, message: "Department created successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create department";
    res.status(400).json({ error: message });
  }
}

export async function getAllDepartments(req: Request, res: Response): Promise<void> {
  try {
    const { college_id, search, limit, offset } = req.query;
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
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: "Department ID is required" });
      return;
    }
    const departmentId = Array.isArray(id) ? id[0] : id;
    const department = await departmentService.getDepartmentById(departmentId!);
    if (!department) {
      res.status(404).json({ error: "Department not found" });
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
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: "Department ID is required" });
      return;
    }
    const departmentId = Array.isArray(id) ? id[0] : id;
    const department = await departmentService.updateDepartment(departmentId!, req.body);
    if (!department) {
      res.status(404).json({ error: "Department not found or no updates provided" });
      return;
    }
    res.json({ department, message: "Department updated successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update department";
    res.status(400).json({ error: message });
  }
}

export async function deleteDepartment(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: "Department ID is required" });
      return;
    }
    const departmentId = Array.isArray(id) ? id[0] : id;
    const deleted = await departmentService.deleteDepartment(departmentId!);
    if (!deleted) {
      res.status(404).json({ error: "Department not found" });
      return;
    }
    res.json({ message: "Department deleted successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete department";
    res.status(500).json({ error: message });
  }
}
