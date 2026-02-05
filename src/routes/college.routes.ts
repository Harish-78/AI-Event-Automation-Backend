import { Router } from "express";
import * as collegeController from "../controllers/college.controller";
import { authenticate } from "../middleware/auth.middleware";

const collegeRouter = Router();

collegeRouter.post("/", authenticate, collegeController.createCollege);
collegeRouter.get("/", authenticate, collegeController.getAllColleges);
collegeRouter.get("/:id", authenticate, collegeController.getCollegeById);
collegeRouter.put("/:id", authenticate, collegeController.updateCollege);
collegeRouter.delete("/:id", authenticate, collegeController.deleteCollege);

export default collegeRouter;
