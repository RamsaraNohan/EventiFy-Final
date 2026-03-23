import { Response } from 'express';
import { AuthRequest } from '../../middleware/requireAuth';
import { CalendarAvailability, Vendor } from '../../database';
import { Op } from 'sequelize';
import { getIo } from '../../lib/socket';

export class CalendarController {
  static async getVendorAvailability(req: AuthRequest, res: Response) {
    try {
      const { vendorId } = req.params;
      const availabilities = await CalendarAvailability.findAll({
        where: { vendorId },
        order: [['blockedDate', 'ASC']],
      });
      res.json(availabilities);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async blockDate(req: AuthRequest, res: Response) {
    try {
      const { vendorId, blockedDate, notes } = req.body;
      const userId = req.user!.id;

      const vendor = await Vendor.findOne({ where: { id: vendorId, ownerUserId: userId } });
      if (!vendor) {
        return res.status(403).json({ message: 'Not authorized to manage this vendor calendar' });
      }

      // Check if already blocked
      const existing = await CalendarAvailability.findOne({
        where: { vendorId, blockedDate }
      });

      if (existing) {
        return res.status(400).json({ message: 'Date is already blocked' });
      }

      const availability = await CalendarAvailability.create({
        vendorId,
        blockedDate,
        notes
      });

      // Emit real-time update
      getIo().emit('calendarUpdated', { vendorId, blockedDate, type: 'block' });

      res.status(201).json(availability);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async unblockDate(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const availability = await CalendarAvailability.findByPk(id);

      if (!availability) {
        return res.status(404).json({ message: 'Blocked date not found' });
      }

      const vendor = await Vendor.findOne({ where: { id: availability.vendorId, ownerUserId: req.user!.id } });
      if (!vendor) {
        return res.status(403).json({ message: 'Not authorized' });
      }

      await availability.destroy();

      // Emit real-time update
      getIo().emit('calendarUpdated', { vendorId: availability.vendorId, blockedDate: availability.blockedDate, type: 'unblock' });

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}
