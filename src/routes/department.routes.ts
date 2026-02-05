import { Router } from "express";
import * as departmentController from "../controllers/department.controller";
import { authenticate } from "../middleware/auth.middleware";

const departmentRouter = Router();

departmentRouter.post("/", authenticate, departmentController.createDepartment);
departmentRouter.get("/", authenticate, departmentController.getAllDepartments);
departmentRouter.get("/:id", authenticate, departmentController.getDepartmentById);
departmentRouter.put("/:id", authenticate, departmentController.updateDepartment);
departmentRouter.delete("/:id", authenticate, departmentController.deleteDepartment);

export default departmentRouter;
