import { Response } from 'express';
import { Notification } from '../../database';
import { AuthRequest } from '../../middleware/requireAuth';

export class NotificationsController {
  static async getNotifications(req: AuthRequest, res: Response) {
    try {
      const notifications = await Notification.findAll({
        where: { userId: req.user!.id },
        order: [['createdAt', 'DESC']],
        limit: 50,
      });

      const unreadCount = await Notification.count({
        where: { userId: req.user!.id, readAt: null },
        
      });

      res.json({ notifications, unreadCount });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getUnreadCount(req: AuthRequest, res: Response) {
    try {
      const count = await Notification.count({
        where: { userId: req.user!.id, readAt: null },
      });
      res.json({ unreadCount: count });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async markAllRead(req: AuthRequest, res: Response) {
    try {
      await Notification.update(
        { readAt: new Date() },
        { where: { userId: req.user!.id, readAt: null } }
      );
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}
