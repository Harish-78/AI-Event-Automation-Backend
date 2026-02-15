import { Router } from "express";
import * as collegeController from "../controllers/college.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const collegeRouter = Router();

// Read - any authenticated user
collegeRouter.get("/", authenticate, collegeController.getAllColleges);
collegeRouter.get("/:id", authenticate, collegeController.getCollegeById);

// Write - superadmin only
collegeRouter.post("/", authenticate, authorize("superadmin"), collegeController.createCollege);
collegeRouter.put("/:id", authenticate, authorize("superadmin"), collegeController.updateCollege);
collegeRouter.delete("/:id", authenticate, authorize("superadmin"), collegeController.deleteCollege);

export default collegeRouter;
