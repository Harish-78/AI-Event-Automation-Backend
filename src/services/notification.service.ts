import sql from "../config/db.config";
import { logger } from "../logger/logger";

export interface Notification {
  id: string;
  user_id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  is_read: boolean;
  link?: string;
  created_at: Date;
}

export const notificationService = {
  async createNotification(data: Omit<Notification, "id" | "is_read" | "created_at">) {
    logger.info({ user_id: data.user_id, type: data.type }, "NotificationService: createNotification - Init");
    try {
      const [notification] = await sql<Notification[]>`
        INSERT INTO notifications (user_id, type, title, message, link)
        VALUES (${data.user_id}, ${data.type}, ${data.title}, ${data.message}, ${data.link || null})
        RETURNING *
      `;
      if (!notification) {
        throw new Error("Failed to create notification");
      }
      logger.info({ id: notification.id }, "NotificationService: createNotification - Completion");
      return notification;
    } catch (error) {
      logger.error({ error }, "NotificationService: createNotification - Error");
      throw error;
    }
  },

  async getUserNotifications(userId: string) {
    logger.info({ userId }, "NotificationService: getUserNotifications - Init");
    try {
      const notifications = await sql<Notification[]>`
        SELECT * FROM notifications 
        WHERE user_id = ${userId} AND is_deleted = FALSE
        ORDER BY created_at DESC
      `;
      logger.info({ count: notifications.length }, "NotificationService: getUserNotifications - Completion");
      return notifications;
    } catch (error) {
      logger.error({ error }, "NotificationService: getUserNotifications - Error");
      throw error;
    }
  },

  async markAsRead(id: string, userId: string) {
    logger.info({ id, userId }, "NotificationService: markAsRead - Init");
    try {
      const [notification] = await sql<Notification[]>`
        UPDATE notifications 
        SET is_read = TRUE 
        WHERE id = ${id} AND user_id = ${userId}
        RETURNING *
      `;
      logger.info({ id }, "NotificationService: markAsRead - Completion");
      return notification;
    } catch (error) {
      logger.error({ error }, "NotificationService: markAsRead - Error");
      throw error;
    }
  },

  async markAllAsRead(userId: string) {
    logger.info({ userId }, "NotificationService: markAllAsRead - Init");
    try {
      await sql`
        UPDATE notifications 
        SET is_read = TRUE 
        WHERE user_id = ${userId} AND is_read = FALSE
      `;
      logger.info({ userId }, "NotificationService: markAllAsRead - Completion");
    } catch (error) {
      logger.error({ error }, "NotificationService: markAllAsRead - Error");
      throw error;
    }
  },

  async deleteNotification(id: string, userId: string) {
    logger.info({ id, userId }, "NotificationService: deleteNotification - Init");
    try {
      await sql`
        UPDATE notifications 
        SET is_deleted = TRUE 
        WHERE id = ${id} AND user_id = ${userId}
      `;
      logger.info({ id }, "NotificationService: deleteNotification - Completion");
    } catch (error) {
      logger.error({ error }, "NotificationService: deleteNotification - Error");
      throw error;
    }
  }
};
