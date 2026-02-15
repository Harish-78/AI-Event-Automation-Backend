import { Router } from "express";
import * as registrationController from "../controllers/registration.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { createRegistrationSchema } from "../validations/registration.validation";

const registrationRouter = Router();

// User routes
registrationRouter.post("/register", authenticate, validate(createRegistrationSchema), registrationController.registerForEvent);
registrationRouter.get("/my", authenticate, registrationController.getMyRegistrations);
registrationRouter.delete("/:id", authenticate, registrationController.cancelMyRegistration);

// Admin routes
registrationRouter.get("/event/:event_id", authenticate, authorize("admin", "superadmin"), registrationController.getEventRegistrations);

export default registrationRouter;
