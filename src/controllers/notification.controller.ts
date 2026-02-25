import { Request, Response } from "express";
import { notificationService } from "../services/notification.service";

export async function getNotifications(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const notifications = await notificationService.getUserNotifications(userId);
    res.json({ notifications });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function markAsRead(req: Request<{ id: string }>, res: Response) {
  try {
    const userId = req.user!.id ;
    const { id } = req.params;
    const notification = await notificationService.markAsRead(id, userId);
    res.json({ notification, message: "Notification marked as read" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function markAllAsRead(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    await notificationService.markAllAsRead(userId);
    res.json({ message: "All notifications marked as read" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function deleteNotification(req: Request<{ id: string }>, res: Response) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    await notificationService.deleteNotification(id, userId);
    res.json({ message: "Notification deleted" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
