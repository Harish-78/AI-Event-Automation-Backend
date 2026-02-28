import { Request, Response } from "express";
import { logger } from "../logger/logger";
import * as collegeService from "../services/college.service";
import { updateUser } from "../services/user.service";

export async function createCollege(req: Request, res: Response): Promise<void> {
  try {
    const college = await collegeService.createCollege({
      ...req.body,
      created_by: (req as any).user?.id
    });

    // If the creator is an Admin, associate them with the new college
    if (req.user && req.user.role === "admin") {
      try {
        await updateUser({
          userId: req.user.id,
          college_id: college.id,
        });
        logger.info({ userId: req.user.id, collegeId: college.id }, "CollegeController: createCollege - Admin associated with college");
      } catch (userUpdateErr) {
        logger.error({ error: userUpdateErr, userId: req.user.id }, "CollegeController: createCollege - Failed to associate Admin with college");
        // We don't fail the college creation if user update fails, but we log it
      }
    }

    res.status(201).json({ college, message: "College created successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create college";
    res.status(400).json({ error: message });
  }
}

export async function getAllColleges(req: Request, res: Response): Promise<void> {
  logger.info({ query: req.query }, "CollegeController: getAllColleges - Hit");
  try {
    const { search, limit, offset } = req.query;
    const result = await collegeService.getAllColleges({
      search: search as string,
      limit: limit ? parseInt(limit as string, 10) : 10,
      offset: offset ? parseInt(offset as string, 10) : 0,
    });
    logger.info({ count: result.colleges.length }, "CollegeController: getAllColleges - Success");
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to retrieve colleges";
    logger.error({ error, message }, "CollegeController: getAllColleges - Error");
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
    const college = await collegeService.updateCollege(collegeId!, {
      ...req.body,
      updated_by: (req as any).user?.id
    });
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
