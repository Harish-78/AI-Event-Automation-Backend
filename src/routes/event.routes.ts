import { Router } from "express";
import * as eventController from "../controllers/event.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { createEventSchema, updateEventSchema } from "../validations/event.validation";

const eventRouter = Router();

eventRouter.post("/", authenticate, authorize("admin", "superadmin"), validate(createEventSchema), eventController.createEvent);
eventRouter.get("/", authenticate, eventController.getAllEvents);
eventRouter.get("/:id", authenticate, eventController.getEventById);
eventRouter.put("/:id", authenticate, authorize("admin", "superadmin"), validate(updateEventSchema), eventController.updateEvent);
eventRouter.delete("/:id", authenticate, authorize("admin", "superadmin"), eventController.deleteEvent);

export default eventRouter;
