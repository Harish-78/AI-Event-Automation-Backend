import { Router } from "express";
<<<<<<< HEAD
import * as userController from "../controllers/user.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
=======

import * as userController from "../controllers/user.controller";
import { authenticate } from "../middleware/auth.middleware";
>>>>>>> origin/main

const userRouter = Router();

userRouter.get("/profile", authenticate, userController.getProfile);
userRouter.put("/profile", authenticate, userController.updateProfile);
<<<<<<< HEAD
userRouter.get("/all", authenticate, authorize("admin", "superadmin"), userController.getAllProfiles);
userRouter.delete("/:id", authenticate, authorize("superadmin"), userController.deleteUser);
=======
userRouter.get("/all", authenticate, userController.getAllProfiles);
userRouter.delete("/:id", authenticate, userController.deleteUser);
>>>>>>> origin/main

export default userRouter;
