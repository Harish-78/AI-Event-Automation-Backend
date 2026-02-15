import { Router } from "express";
import * as eventController from "../controllers/event.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const eventRouter = Router();

// Read - any authenticated user
eventRouter.get("/", authenticate, eventController.getAllEvents);
eventRouter.get("/:id", authenticate, eventController.getEventById);

// Write - admin and superadmin only
eventRouter.post("/", authenticate, authorize("admin", "superadmin"), eventController.createEvent);
eventRouter.put("/:id", authenticate, authorize("admin", "superadmin"), eventController.updateEvent);
eventRouter.delete("/:id", authenticate, authorize("admin", "superadmin"), eventController.deleteEvent);

export default eventRouter;
