import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/requireAuth';
import { Event, EventVendor, Vendor, User, Task, Notification, Conversation, CalendarAvailability } from '../../database';
import { io } from '../../socket';
import { differenceInDays } from 'date-fns';
import { Op } from 'sequelize';
import { EmailService } from '../../utils/email';

export class EventsController {
  // ---------- CLIENT: Event CRUD ----------

  static async getMyEvents(req: AuthRequest, res: Response) {
    try {
      const events = await Event.findAll({
        where: { clientId: req.user!.id },
        include: [{
          model: EventVendor,
          as: 'eventVendors',
          include: [
            { model: Vendor, as: 'vendor', attributes: ['id', 'businessName', 'category', 'city', 'approved'] },
            { model: Task, as: 'tasks' }
          ]
        }],
        order: [['createdAt', 'DESC']]
      });

      // Auto-update status based on date
      const now = new Date();
      const result = events.map((evt: any) => {
        const daysLeft = differenceInDays(new Date(evt.date), now);
        let status = evt.status;
        if (status !== 'COMPLETED' && status !== 'PAYMENT_OVERDUE') {
          if (daysLeft <= 0) status = 'COMPLETED';
          else if (daysLeft <= 7) status = 'EVENT_SOON';
        }
        return { ...evt.toJSON(), daysLeft, status };
      });

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getEventById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const event = await Event.findByPk(id, {
        include: [{
          model: EventVendor,
          as: 'eventVendors',
          include: [
            { model: Vendor, as: 'vendor', include: [{ model: User, as: 'owner', attributes: ['id', 'name', 'avatarUrl'] }] },
            { model: Task, as: 'tasks' }
          ]
        }]
      });
      if (!event) return res.status(404).json({ message: 'Event not found' });

      const evt = event as any;
      if (evt.clientId !== req.user!.id && req.user!.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Forbidden' });
      }
      res.json(event);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async createEvent(req: AuthRequest, res: Response) {
    try {
      const { name, date, location, budget, notes } = req.body;
      const event = await Event.create({
        clientId: req.user!.id,
        name, date, location, budget, notes,
        status: 'PLANNING'
      });
      res.status(201).json(event);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async updateEvent(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const event = await Event.findByPk(id);
      if (!event) return res.status(404).json({ message: 'Event not found' });
      const evt = event as any;
      if (evt.clientId !== req.user!.id) return res.status(403).json({ message: 'Forbidden' });
      await event.update(req.body);
      res.json(event);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async deleteEvent(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const event = await Event.findByPk(id);
      if (!event) return res.status(404).json({ message: 'Event not found' });
      const evt = event as any;
      if (evt.clientId !== req.user!.id) return res.status(403).json({ message: 'Forbidden' });
      await event.destroy();
      res.json({ message: 'Event deleted' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  // ---------- CLIENT: Add Vendor to Event ----------

  static async addVendorToEvent(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params; // eventId
      const { vendorId, agreedCost } = req.body;

      const event = await Event.findByPk(id);
      if (!event) return res.status(404).json({ message: 'Event not found' });
      const evt = event as any;
      if (evt.clientId !== req.user!.id) return res.status(403).json({ message: 'Forbidden' });

      const vendor = await Vendor.findByPk(vendorId, { include: [{ model: User, as: 'owner' }] }) as any;
      if (!vendor) return res.status(404).json({ message: 'Vendor not found' });

      // Check not already added
      const existing = await EventVendor.findOne({ where: { eventId: id, vendorId } });
      if (existing) return res.status(400).json({ message: 'Vendor already added to this event' });

      // Availability Check 1: Manual Blocks
      const blocked = await CalendarAvailability.findOne({
        where: { vendorId, blockedDate: evt.date }
      });
      if (blocked) {
        return res.status(400).json({ message: 'Vendor has marked this date as unavailable/blocked.' });
      }

      // Availability Check 2: Conflicting Approved Bookings
      const conflict = await EventVendor.findOne({
        include: [{
          model: Event,
          as: 'event',
          where: { date: evt.date }
        }],
        where: {
          vendorId,
          status: { [Op.in]: ['APPROVED', 'ADVANCE_PAID', 'COMPLETED', 'FULLY_PAID'] }
        }
      });
      if (conflict) {
        return res.status(400).json({ message: 'Vendor is already committed to another event on this date.' });
      }

      // Create conversation between client and vendor
      let conversation = await Conversation.findOne({ where: { clientUserId: req.user!.id, vendorId } });
      if (!conversation) {
        conversation = await Conversation.create({ clientUserId: req.user!.id, vendorId, lastMessageAt: new Date() });
      }

      const eventVendor = await EventVendor.create({
        eventId: id,
        vendorId,
        agreedCost,
        status: 'PENDING',
        conversationId: conversation.id
      });

      // Notify vendor
      const notif = await Notification.create({
        userId: vendor.ownerUserId,
        type: 'NEW_BOOKING_REQUEST',
        title: 'New Event Request',
        body: `${req.user!.name} has added you to event "${evt.name}"`,
        href: `/bookings`
      });
      io.to(`user_${vendor.ownerUserId}`).emit('notification:new', notif);

      // Send Email
      EmailService.sendBookingReceived(vendor.owner.email, vendor.businessName, evt.name).catch(console.error);

      // Update event status
      await event.update({ status: 'VENDORS_PENDING' });

      res.status(201).json(eventVendor);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  // ---------- VENDOR: Get their event bookings ----------

  static async getVendorEvents(req: AuthRequest, res: Response) {
    try {
      const vendor = await Vendor.findOne({ where: { ownerUserId: req.user!.id } }) as any;
      if (!vendor) return res.json([]);

      const eventVendors = await EventVendor.findAll({
        where: { vendorId: vendor.id },
        include: [
          { model: Event, as: 'event', include: [{ model: User, as: 'client', attributes: ['id', 'name', 'avatarUrl'] }] },
          { model: Task, as: 'tasks' }
        ],
        order: [[{ model: Event, as: 'event' }, 'date', 'ASC']]
      });

      res.json(eventVendors);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  // ---------- VENDOR: Approve/Reject event booking ----------

  static async respondToBooking(req: AuthRequest, res: Response) {
    try {
      const { eventVendorId } = req.params;
      const { action } = req.body; // 'approve' | 'reject'

      const eventVendor = await EventVendor.findByPk(eventVendorId, {
        include: [
          { model: Event, as: 'event', include: [{ model: User, as: 'client' }] },
          { model: Vendor, as: 'vendor' }
        ]
      }) as any;
      if (!eventVendor) return res.status(404).json({ message: 'Not found' });

      const vendor = await Vendor.findByPk(eventVendor.vendorId) as any;
      if (!vendor || vendor.ownerUserId !== req.user!.id) return res.status(403).json({ message: 'Forbidden' });

      if (action === 'approve') {
        const newStatus = 'APPROVED';
        // Calculate advance (50%)
        const advance = eventVendor.agreedCost ? eventVendor.agreedCost * 0.5 : 0;
        await eventVendor.update({ status: newStatus, advancePaid: 0, remainingAmount: advance });

        // Notify client
        const notif = await Notification.create({
          userId: eventVendor.event.clientId,
          type: 'VENDOR_APPROVED',
          title: 'Vendor Approved Your Request!',
          body: `${vendor.businessName} accepted your request for "${eventVendor.event.name}"`,
          href: `/events/${eventVendor.eventId}`
        });
        io.to(`user_${eventVendor.event.clientId}`).emit('notification:new', notif);

        // Send Email
        EmailService.sendBookingAccepted(eventVendor.event.client.email, eventVendor.event.client.name, vendor.businessName).catch(console.error);
        
        res.json(eventVendor);
      } else {
        // Handle rejection - destroy the record
        await eventVendor.destroy();

        // Notify client
        const notif = await Notification.create({
          userId: eventVendor.event.clientId,
          type: 'VENDOR_REJECTED',
          title: 'Vendor Declined Your Request',
          body: `${vendor.businessName} is unavailable for "${eventVendor.event.name}"`,
          href: `/events/${eventVendor.event.id}`
        });
        io.to(`user_${eventVendor.event.clientId}`).emit('notification:new', notif);

        // Send Email
        EmailService.sendBookingRejected(eventVendor.event.client.email, eventVendor.event.client.name, vendor.businessName).catch(console.error);
        
        res.json({ message: 'Booking rejected' });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  // ---------- ADMIN: Manage all events ----------

  static async getAllEventsForAdmin(req: AuthRequest, res: Response) {
    try {
      if (req.user!.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const events = await Event.findAll({
        include: [
          { model: User, as: 'client', attributes: ['id', 'name', 'email', 'avatarUrl'] },
          {
            model: EventVendor,
            as: 'eventVendors',
            include: [
              { model: Vendor, as: 'vendor', attributes: ['id', 'businessName', 'category'] },
              { model: Task, as: 'tasks' }
            ]
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      const now = new Date();
      const result = events.map((evt: any) => {
        const daysLeft = differenceInDays(new Date(evt.date), now);
        let status = evt.status;
        if (status !== 'COMPLETED' && status !== 'PAYMENT_OVERDUE') {
          if (daysLeft <= 0) status = 'COMPLETED';
          else if (daysLeft <= 7) status = 'EVENT_SOON';
        }
        return { ...evt.toJSON(), daysLeft, status };
      });

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  // ---------- CLIENT: Remove Vendor from Event ----------

  static async removeVendorFromEvent(req: AuthRequest, res: Response) {
    try {
      const { id, eventVendorId } = req.params;

      const eventVendor = await EventVendor.findByPk(eventVendorId, {
        include: [{ model: Event, as: 'event' }]
      }) as any;

      if (!eventVendor) return res.status(404).json({ message: 'Booking not found' });
      
      // Verify ownership
      if (eventVendor.event.clientId !== req.user!.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      if (eventVendor.status !== 'PENDING') {
        return res.status(400).json({ message: 'Only pending vendor requests can be removed directly.' });
      }

      await eventVendor.destroy();
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}
