import { Router } from "express";
import * as userController from "../controllers/user.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const userRouter = Router();

userRouter.get("/profile", authenticate, userController.getProfile);
userRouter.put("/profile", authenticate, userController.updateProfile);
userRouter.get("/all", authenticate, authorize("admin", "superadmin"), userController.getAllProfiles);
userRouter.delete("/:id", authenticate, authorize("superadmin"), userController.deleteUser);

export default userRouter;
