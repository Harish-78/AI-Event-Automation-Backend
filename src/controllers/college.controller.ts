import { Request, Response } from "express";
import * as collegeService from "../services/college.service";

export async function createCollege(req: Request, res: Response): Promise<void> {
  try {
    const college = await collegeService.createCollege(req.body);
    res.status(201).json({ college, message: "College created successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create college";
    res.status(400).json({ error: message });
  }
}

export async function getAllColleges(req: Request, res: Response): Promise<void> {
  try {
    const { search, limit, offset } = req.query;
    const result = await collegeService.getAllColleges({
      search: search as string,
      limit: limit ? parseInt(limit as string, 10) : 10,
      offset: offset ? parseInt(offset as string, 10) : 0,
    });
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to retrieve colleges";
    res.status(500).json({ error: message });
  }
}

export async function getCollegeById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: "College ID is required" });
      return;
    }
    const collegeId = Array.isArray(id) ? id[0] : id;
    const college = await collegeService.getCollegeById(collegeId!);
    if (!college) {
      res.status(404).json({ error: "College not found" });
      return;
    }
    res.json({ college });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to retrieve college";
    res.status(500).json({ error: message });
  }
}

export async function updateCollege(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: "College ID is required" });
      return;
    }
    const collegeId = Array.isArray(id) ? id[0] : id;
    const college = await collegeService.updateCollege(collegeId!, req.body);
    if (!college) {
      res.status(404).json({ error: "College not found or no updates provided" });
      return;
    }
    res.json({ college, message: "College updated successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update college";
    res.status(400).json({ error: message });
  }
}

export async function deleteCollege(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: "College ID is required" });
      return;
    }
    const collegeId = Array.isArray(id) ? id[0] : id;
    const deleted = await collegeService.deleteCollege(collegeId!);
    if (!deleted) {
      res.status(404).json({ error: "College not found" });
      return;
    }
    res.json({ message: "College deleted successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete college";
    res.status(500).json({ error: message });
  }
}
