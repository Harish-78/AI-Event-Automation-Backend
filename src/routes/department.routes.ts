import { Router } from "express";
import * as departmentController from "../controllers/department.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { createDepartmentSchema, updateDepartmentSchema } from "../validations/department.validation";

const departmentRouter = Router();

departmentRouter.post("/", authenticate, authorize("admin", "superadmin"), validate(createDepartmentSchema), departmentController.createDepartment);
departmentRouter.get("/", authenticate, authorize("admin", "superadmin"), departmentController.getAllDepartments);
departmentRouter.get("/:id", authenticate, authorize("admin", "superadmin"), departmentController.getDepartmentById);
departmentRouter.put("/:id", authenticate, authorize("admin", "superadmin"), validate(updateDepartmentSchema), departmentController.updateDepartment);
departmentRouter.delete("/:id", authenticate, authorize("admin", "superadmin"), departmentController.deleteDepartment);

export default departmentRouter;
