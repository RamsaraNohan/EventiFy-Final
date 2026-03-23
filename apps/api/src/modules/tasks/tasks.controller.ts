import { Response } from 'express';
import { AuthRequest } from '../../middleware/requireAuth';
import { Task, EventVendor, Vendor, Event, Notification, User } from '../../database';
import { io } from '../../socket';
import { EmailService } from '../../utils/email';

export class TasksController {

  static async getTasksForEventVendor(req: AuthRequest, res: Response) {
    try {
      const { eventVendorId } = req.params;
      const tasks = await Task.findAll({ where: { eventVendorId } });
      res.json(tasks);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async createTask(req: AuthRequest, res: Response) {
    try {
      const { eventVendorId } = req.params;
      const { title, description } = req.body;

      const eventVendor = await EventVendor.findByPk(eventVendorId, {
        include: [{ model: Event, as: 'event' }]
      }) as any;
      if (!eventVendor) return res.status(404).json({ message: 'EventVendor not found' });

      const vendor = await Vendor.findByPk(eventVendor.vendorId) as any;

      // Only vendor or client can create tasks
      const isVendorOwner = vendor?.ownerUserId === req.user!.id;
      const isClient = eventVendor.event?.clientId === req.user!.id;
      if (!isVendorOwner && !isClient) return res.status(403).json({ message: 'Forbidden' });

      const task = await Task.create({ eventVendorId, title, description });

      // Notify the other party
      if (isClient && vendor) {
        const notif = await Notification.create({
          userId: vendor.ownerUserId,
          type: 'NEW_TASK',
          title: 'New Task Added',
          body: `Client added a new task: "${title}"`,
          href: `/bookings`
        });
        io.to(`user_${vendor.ownerUserId}`).emit('notification:new', notif);
      }

      res.status(201).json(task);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async updateTask(req: AuthRequest, res: Response) {
    try {
      const { taskId } = req.params;
      const { status, progress, notes } = req.body;

      const task = await Task.findByPk(taskId, {
        include: [{
          model: EventVendor,
          as: 'eventVendor',
          include: [
            { model: Event, as: 'event' },
            { model: Vendor, as: 'vendor' }
          ]
        }]
      }) as any;

      if (!task) return res.status(404).json({ message: 'Task not found' });

      const vendor = task.eventVendor?.vendor;
      const isVendorOwner = vendor?.ownerUserId === req.user!.id;
      if (!isVendorOwner && req.user!.role !== 'ADMIN') return res.status(403).json({ message: 'Only vendor can update tasks' });

      // Handle File Uploads (Append to existing files)
      let updatedFiles = task.files || [];
      if (req.files && (req.files as any).length > 0) {
        const newFiles = (req.files as Express.Multer.File[]).map(f => f.path);
        updatedFiles = [...updatedFiles, ...newFiles];
      }

      await task.update({ status, progress, notes, files: updatedFiles });

      // Notify client
      const clientId = task.eventVendor?.event?.clientId;
      if (clientId) {
        const notif = await Notification.create({
          userId: clientId,
          type: 'TASK_UPDATED',
          title: 'Task Updated',
          body: `${vendor?.businessName} updated task "${task.title}" to ${progress}%`,
          href: `/events/${task.eventVendor?.eventId}`
        });
        io.to(`user_${clientId}`).emit('notification:new', notif);

        // Send Email
        const client = await User.findByPk(clientId);
        if (client) {
          EmailService.sendTaskUpdated(client.email, client.name, vendor?.businessName || 'Vendor', task.title, status).catch(console.error);
        }
      }

      res.json(task);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async deleteTask(req: AuthRequest, res: Response) {
    try {
      const { taskId } = req.params;
      const task = await Task.findByPk(taskId) as any;
      if (!task) return res.status(404).json({ message: 'Task not found' });
      await task.destroy();
      res.json({ message: 'Task deleted' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}
