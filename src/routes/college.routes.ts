import { Router } from "express";
import * as collegeController from "../controllers/college.controller";
<<<<<<< HEAD
import { authenticate, authorize } from "../middleware/auth.middleware";

const collegeRouter = Router();

// Read - any authenticated user
collegeRouter.get("/", authenticate, collegeController.getAllColleges);
collegeRouter.get("/:id", authenticate, collegeController.getCollegeById);

// Write - superadmin only
collegeRouter.post("/", authenticate, authorize("superadmin"), collegeController.createCollege);
collegeRouter.put("/:id", authenticate, authorize("superadmin"), collegeController.updateCollege);
collegeRouter.delete("/:id", authenticate, authorize("superadmin"), collegeController.deleteCollege);
=======
import { authenticate } from "../middleware/auth.middleware";

const collegeRouter = Router();

collegeRouter.post("/", authenticate, collegeController.createCollege);
collegeRouter.get("/", authenticate, collegeController.getAllColleges);
collegeRouter.get("/:id", authenticate, collegeController.getCollegeById);
collegeRouter.put("/:id", authenticate, collegeController.updateCollege);
collegeRouter.delete("/:id", authenticate, collegeController.deleteCollege);
>>>>>>> origin/main

export default collegeRouter;
