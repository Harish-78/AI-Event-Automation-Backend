import { Router } from "express";
import * as registrationController from "../controllers/registration.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const registrationRouter = Router();

// User routes
registrationRouter.post("/:eventId/register", authenticate, registrationController.registerForEvent);
registrationRouter.post("/:eventId/cancel", authenticate, registrationController.cancelRegistration);
registrationRouter.get("/:eventId/check", authenticate, registrationController.checkRegistration);
registrationRouter.get("/my", authenticate, registrationController.getMyRegistrations);

// Admin/SuperAdmin - view registrations for an event
registrationRouter.get("/:eventId/list", authenticate, authorize("admin", "superadmin"), registrationController.getEventRegistrations);

export default registrationRouter;
