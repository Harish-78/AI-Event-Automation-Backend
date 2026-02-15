import { Router } from "express";
import * as departmentController from "../controllers/department.controller";
<<<<<<< HEAD
import { authenticate, authorize } from "../middleware/auth.middleware";

const departmentRouter = Router();

// Read - any authenticated user
departmentRouter.get("/", authenticate, departmentController.getAllDepartments);
departmentRouter.get("/:id", authenticate, departmentController.getDepartmentById);

// Write - admin and superadmin only
departmentRouter.post("/", authenticate, authorize("admin", "superadmin"), departmentController.createDepartment);
departmentRouter.put("/:id", authenticate, authorize("admin", "superadmin"), departmentController.updateDepartment);
departmentRouter.delete("/:id", authenticate, authorize("admin", "superadmin"), departmentController.deleteDepartment);
=======
import { authenticate } from "../middleware/auth.middleware";

const departmentRouter = Router();

departmentRouter.post("/", authenticate, departmentController.createDepartment);
departmentRouter.get("/", authenticate, departmentController.getAllDepartments);
departmentRouter.get("/:id", authenticate, departmentController.getDepartmentById);
departmentRouter.put("/:id", authenticate, departmentController.updateDepartment);
departmentRouter.delete("/:id", authenticate, departmentController.deleteDepartment);
>>>>>>> origin/main

export default departmentRouter;
