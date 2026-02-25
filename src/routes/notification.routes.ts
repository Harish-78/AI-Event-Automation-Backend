import { Router } from "express";
import * as notificationController from "../controllers/notification.controller";
import { authenticate } from "../middleware/auth.middleware";

const notificationRouter = Router();

notificationRouter.get("/", authenticate, notificationController.getNotifications);
notificationRouter.put("/read-all", authenticate, notificationController.markAllAsRead);
notificationRouter.put("/:id/read", authenticate, notificationController.markAsRead);
notificationRouter.delete("/:id", authenticate, notificationController.deleteNotification);

export default notificationRouter;
