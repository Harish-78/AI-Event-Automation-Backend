import { Router } from "express";
import * as eventController from "../controllers/event.controller";
<<<<<<< HEAD
import { authenticate, authorize } from "../middleware/auth.middleware";

const eventRouter = Router();

// Read - any authenticated user
eventRouter.get("/", authenticate, eventController.getAllEvents);
eventRouter.get("/:id", authenticate, eventController.getEventById);

// Write - admin and superadmin only
eventRouter.post("/", authenticate, authorize("admin", "superadmin"), eventController.createEvent);
eventRouter.put("/:id", authenticate, authorize("admin", "superadmin"), eventController.updateEvent);
eventRouter.delete("/:id", authenticate, authorize("admin", "superadmin"), eventController.deleteEvent);
=======
import { authenticate } from "../middleware/auth.middleware";

const eventRouter = Router();

eventRouter.post("/", authenticate, eventController.createEvent);
eventRouter.get("/", authenticate, eventController.getAllEvents);
eventRouter.get("/:id", authenticate, eventController.getEventById);
eventRouter.put("/:id", authenticate, eventController.updateEvent);
eventRouter.delete("/:id", authenticate, eventController.deleteEvent);
>>>>>>> origin/main

export default eventRouter;
