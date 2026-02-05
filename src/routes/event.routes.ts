import { Router } from "express";
import * as eventController from "../controllers/event.controller";
import { authenticate } from "../middleware/auth.middleware";

const eventRouter = Router();

eventRouter.post("/", authenticate, eventController.createEvent);
eventRouter.get("/", authenticate, eventController.getAllEvents);
eventRouter.get("/:id", authenticate, eventController.getEventById);
eventRouter.put("/:id", authenticate, eventController.updateEvent);
eventRouter.delete("/:id", authenticate, eventController.deleteEvent);

export default eventRouter;
