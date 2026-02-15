import { Router } from "express";
import * as collegeController from "../controllers/college.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { createCollegeSchema, updateCollegeSchema } from "../validations/college.validation";

const collegeRouter = Router();

collegeRouter.post("/", authenticate, authorize("superadmin"), validate(createCollegeSchema), collegeController.createCollege);
collegeRouter.get("/", authenticate, collegeController.getAllColleges);
collegeRouter.get("/:id", authenticate, collegeController.getCollegeById);
collegeRouter.put("/:id", authenticate, authorize("superadmin"), validate(updateCollegeSchema), collegeController.updateCollege);
collegeRouter.delete("/:id", authenticate, authorize("superadmin"), collegeController.deleteCollege);

export default collegeRouter;
