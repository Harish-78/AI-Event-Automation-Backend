import { Router } from "express";
import * as inviteController from "../controllers/invite.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const inviteRouter = Router();

// Public route - validate invite token (used by signup form)
inviteRouter.get("/validate/:token", inviteController.validateInvite);

// SuperAdmin only routes
inviteRouter.post("/", authenticate, authorize("superadmin"), inviteController.createInvite);
inviteRouter.get("/", authenticate, authorize("superadmin"), inviteController.getInvites);
inviteRouter.delete("/:id", authenticate, authorize("superadmin"), inviteController.deleteInvite);

export default inviteRouter;
