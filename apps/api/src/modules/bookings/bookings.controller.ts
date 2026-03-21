import { Response } from 'express';
import { Booking, Vendor, Notification } from '../../database';
import { AuthRequest } from '../../middleware/requireAuth';
import { Server } from 'socket.io';

export class BookingsController {
  static async createBooking(req: AuthRequest, res: Response) {
    try {
      const { vendorId, startTime, endTime } = req.body;
      const clientUserId = req.user!.id;

      const vendor = await Vendor.findByPk(vendorId);
      if (!vendor) return res.status(404).json({ message: 'Vendor not found' });

      const booking = await Booking.create({
        vendorId,
        clientUserId,
        startTime,
        endTime,
        status: 'PENDING',
      });

      // Notify Vendor Owner
      const notification = await Notification.create({
        userId: vendor.ownerUserId,
        type: 'BOOKING_REQUEST',
        title: 'New Booking Request',
        body: `${req.user!.name} requested a booking for ${vendor.businessName}.`,
        href: `/bookings/${booking.id}`,
      });

      // Emit socket event
      const io: Server = req.app.get('io');
      if (io) {
        io.to(`user_${vendor.ownerUserId}`).emit('notification:new', notification);
      }

      res.status(201).json(booking);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}
