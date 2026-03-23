import { Response } from 'express';
import { Booking, Vendor, Notification, User } from '../../database';
import { AuthRequest } from '../../middleware/requireAuth';
import { Server } from 'socket.io';

export class BookingsController {
  
  // Creates a new Booking request from Client -> Vendor
  static async createBooking(req: AuthRequest, res: Response) {
    try {
      const { vendorId, startTime, endTime } = req.body;
      const clientUserId = req.user!.id;

      if (req.user!.role !== 'CLIENT') {
        return res.status(403).json({ message: 'Only clients can request bookings.' });
      }

      const vendor: any = await Vendor.findByPk(vendorId);
      if (!vendor) return res.status(404).json({ message: 'Vendor not found' });

      // Check if dates are requested in the past
      if (new Date(startTime) < new Date()) {
        return res.status(400).json({ message: 'Cannot book in the past' });
      }

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
        href: `/bookings`,
      });

      // Emit socket event to Vendor
      const io: Server = req.app.get('io');
      if (io) {
        io.to(`user_${vendor.ownerUserId}`).emit('notification:new', notification);
      }

      res.status(201).json(booking);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  // Get Bookings for a Client
  static async getClientBookings(req: AuthRequest, res: Response) {
    try {
      if (req.user!.role !== 'CLIENT' && req.user!.role !== 'ADMIN') return res.status(403).json({ message: 'Forbidden' });
      
      const bookings = await Booking.findAll({
        where: req.user!.role === 'ADMIN' ? {} : { clientUserId: req.user!.id },
        include: [{ model: Vendor, as: 'vendor', attributes: ['id', 'businessName', 'category'] }],
        order: [['createdAt', 'DESC']]
      });
      res.json(bookings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  // Get Bookings targeting a specific Vendor (for VendorDashboard)
  static async getVendorBookings(req: AuthRequest, res: Response) {
    try {
      if (req.user!.role !== 'VENDOR_OWNER' && req.user!.role !== 'ADMIN') return res.status(403).json({ message: 'Forbidden' });
      
      let where = {};
      if (req.user!.role === 'VENDOR_OWNER') {
        const vendor: any = await Vendor.findOne({ where: { ownerUserId: req.user!.id } });
        if (!vendor) return res.json([]); // Return empty instead of 404
        where = { vendorId: vendor.id };
      }

      const bookings = await Booking.findAll({
        where,
        include: [{ model: User, as: 'client', attributes: ['id', 'name', 'email'] }],
        order: [['createdAt', 'DESC']]
      });
      res.json(bookings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  // Accept or Reject a booking (Vendor only)
  static async updateBookingStatus(req: AuthRequest, res: Response) {
    try {
      if (req.user!.role !== 'VENDOR_OWNER') return res.status(403).json({ message: 'Forbidden' });
      
      const { id } = req.params;
      const { status } = req.body; // 'CONFIRMED' or 'REJECTED'

      if (!['CONFIRMED', 'REJECTED'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status update' });
      }

      const booking: any = await Booking.findByPk(id, {
        include: [{ model: Vendor, as: 'vendor' }]
      });

      if (!booking) return res.status(404).json({ message: 'Booking not found' });
      
      // Enforce the current user actually owns the vendor being booked
      if (booking.vendor.ownerUserId !== req.user!.id) {
         return res.status(403).json({ message: 'Not authorized to mutate this booking' });
      }

      booking.status = status;
      await booking.save();

      // Notify Client
      const notification = await Notification.create({
        userId: booking.clientUserId,
        type: 'BOOKING_UPDATE',
        title: `Booking ${status}`,
        body: `${booking.vendor.businessName} has ${status.toLowerCase()} your event booking.`,
        href: `/events`,
      });

      const io: Server = req.app.get('io');
      if (io) {
        io.to(`user_${booking.clientUserId}`).emit('notification:new', notification);
      }

      res.json(booking);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}
