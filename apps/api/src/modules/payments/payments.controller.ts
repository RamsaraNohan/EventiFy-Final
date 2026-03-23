import { Response } from 'express';
import { Booking, Vendor, Transaction, Notification, EventVendor, Event, User } from '../../database';
import { AuthRequest } from '../../middleware/requireAuth';
import { env } from '../../config/env';
import crypto from 'crypto';
import { io } from '../../socket';
import { EmailService } from '../../utils/email';

export class PaymentsController {
  
  // Prepare payment details for frontend checkout (Old booking flow)
  static async createCheckoutSession(req: AuthRequest, res: Response) {
    try {
      const { bookingId } = req.params;
      
      const booking: any = await Booking.findByPk(bookingId, {
        include: [{ model: Vendor, as: 'vendor' }]
      });

      if (!booking) return res.status(404).json({ message: 'Booking not found' });
      if (booking.clientUserId !== req.user!.id) return res.status(403).json({ message: 'Forbidden' });
      // ... existing logic ...
      const totalAmount = booking.vendor.basePrice;
      const depositAmount = totalAmount * 0.2;
      const amountWithFee = depositAmount + 5; 
      const currency = 'LKR';
      
      const secretHash = crypto.createHash('md5').update(env.PAYHERE_SECRET).digest('hex').toUpperCase();
      const rawHash = env.PAYHERE_MERCHANT_ID + booking.id + amountWithFee.toFixed(2) + currency + secretHash;
      const hash = crypto.createHash('md5').update(rawHash).digest('hex').toUpperCase();

      await booking.update({ totalAmount, depositAmount });

      res.json({
        merchant_id: env.PAYHERE_MERCHANT_ID,
        order_id: booking.id,
        items: `Event Booking: ${booking.vendor.businessName}`,
        amount: amountWithFee.toFixed(2),
        currency,
        hash,
        first_name: req.user!.name.split(' ')[0],
        last_name: req.user!.name.split(' ')[1] || 'User',
        email: req.user!.email,
        phone: '0771234567',
        address: 'Colombo',
        city: 'Colombo',
        country: 'Sri Lanka'
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  // New event-vendor based checkout (advance payment)
  static async createEventVendorCheckout(req: AuthRequest, res: Response) {
    try {
      const { eventVendorId } = req.params;
      
      const eventVendor = await EventVendor.findByPk(eventVendorId, {
        include: [
          { model: Vendor, as: 'vendor' },
          { model: Event, as: 'event' }
        ]
      }) as any;

      if (!eventVendor) return res.status(404).json({ message: 'Event Vendor link not found' });
      if (eventVendor.event.clientId !== req.user!.id) return res.status(403).json({ message: 'Forbidden' });

      // Calculate 50% advance for EventVendor flow as per specifications
      const totalAmount = eventVendor.agreedCost || eventVendor.vendor.basePrice;
      const advanceAmount = totalAmount * 0.5;
      const amountWithFee = advanceAmount + 10; // 10 fixed fee
      const currency = 'LKR';
      
      const secretHash = crypto.createHash('md5').update(env.PAYHERE_SECRET).digest('hex').toUpperCase();
      const rawHash = env.PAYHERE_MERCHANT_ID + eventVendor.id + amountWithFee.toFixed(2) + currency + secretHash;
      const hash = crypto.createHash('md5').update(rawHash).digest('hex').toUpperCase();

      res.json({
        merchant_id: env.PAYHERE_MERCHANT_ID,
        order_id: eventVendor.id,
        items: `Advance: ${eventVendor.vendor.businessName} for ${eventVendor.event.name}`,
        amount: amountWithFee.toFixed(2),
        currency,
        hash,
        first_name: req.user!.name.split(' ')[0],
        last_name: req.user!.name.split(' ')[1] || 'User',
        email: req.user!.email,
        phone: req.user!.phone || '0771234567',
        address: 'Colombo',
        city: 'Colombo',
        country: 'Sri Lanka'
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }


  // PayHere Notification Webhook
  static async notify(req: any, res: Response) {
    try {
      const { 
        merchant_id, 
        order_id, 
        payhere_amount, 
        payhere_currency, 
        status_code, 
        md5sig, 
        payment_id 
      } = req.body;

      console.log(`[PayHere Webhook] Entry for Order: ${order_id}, Status: ${status_code}, Amount: ${payhere_amount}`);
      
      // Verify Signature
      const secret = env.PAYHERE_SECRET;
      const hashedSecret = crypto.createHash('md5').update(secret).digest('hex').toUpperCase();
      const expectedSig = crypto
        .createHash('md5')
        .update(
          merchant_id +
          order_id +
          payhere_amount +
          payhere_currency +
          status_code +
          hashedSecret
        )
        .digest('hex')
        .toUpperCase();

      const isSimulation = req.headers['x-simulation'] === 'true' && env.NODE_ENV === 'development';

      if (md5sig !== expectedSig && !isSimulation) {
        console.warn(`[PayHere Webhook] Invalid signature — possible fake payment attempt for order ${order_id}`);
        return res.status(400).json({ success: false, message: 'Invalid signature' });
      }

      // Status Processing (2 = Success)
      if (status_code !== '2') {
        console.log(`[PayHere Webhook] Non-success status: ${status_code} for order ${order_id}`);
        return res.status(200).send('OK'); // Always 200 to PayHere to stop retries
      }

      // Find the link (EventVendor is our primary model for payments now)
      let eventVendor = await EventVendor.findByPk(order_id, {
        include: [
          { model: Event, as: 'event' }, 
          { model: Vendor, as: 'vendor', include: [{ model: User, as: 'owner' }] }
        ]
      }) as any;

      if (!eventVendor) {
        // Fallback to legacy Booking model
        const booking: any = await Booking.findByPk(order_id);
        if (booking) {
          console.log(`[Payment] Success for legacy Booking: ${booking.id}`);
          await booking.update({ 
            status: 'CONFIRMED', 
            depositAmount: parseFloat(payhere_amount) 
          });

          await Transaction.create({
            bookingId: booking.id,
            userId: booking.clientUserId,
            amount: parseFloat(payhere_amount),
            currency: payhere_currency,
            provider: 'PAYHERE',
            providerTransactionId: payment_id,
            status: 'COMPLETED',
            type: 'DEPOSIT'
          });
        }
        return res.status(200).send('OK');
      }

      // Process Success for EventVendor
      const amount = parseFloat(payhere_amount);
      const fee = 10; 
      const advanceAmount = amount - fee;

      // Mark as Advance Paid
      await eventVendor.update({ 
        status: 'ADVANCE_PAID',
        advancePaid: advanceAmount
      });

      // Log Transaction for Client
      await Transaction.create({
        userId: eventVendor.event.clientId,
        amount: advanceAmount,
        currency: payhere_currency,
        provider: 'PAYHERE',
        providerTransactionId: payment_id,
        status: 'COMPLETED',
        type: 'DEPOSIT',
        metadata: { 
          eventVendorId: eventVendor.id, 
          eventId: eventVendor.eventId,
          platformFee: fee
        }
      });

      // Unified Notification System
      const vendor = eventVendor.vendor;
      if (vendor) {
        const notif = await Notification.create({
          userId: vendor.ownerUserId,
          type: 'PAYMENT_REQUIRED',
          title: 'Advance Payment Received',
          body: `Advance receipt of ${payhere_currency} ${advanceAmount.toLocaleString()} confirmed for "${eventVendor.event.name}".`,
          href: `/bookings`
        });
        io.to(`user_${vendor.ownerUserId}`).emit('notification:new', notif);
        
        io.to(`user-${vendor.ownerUserId}`).emit('notificationPush', {
          title: 'Payment confirmed',
          message: `Client payment of LKR ${advanceAmount.toLocaleString()} has been received`,
          type: 'PAYMENT',
        });

        EmailService.sendAdvancePaid(vendor.owner.email, vendor.businessName, eventVendor.event.name, advanceAmount).catch(console.error);
      }

      const clientNotif = await Notification.create({
        userId: eventVendor.event.clientId,
        type: 'BOOKING_UPDATE',
        title: 'Payment Successful',
        body: `Your advance payment for ${vendor?.businessName || 'Vendor'} was processed successfully.`,
        href: `/events/${eventVendor.eventId}`
      });
      io.to(`user_${eventVendor.event.clientId}`).emit('notification:new', clientNotif);
      io.to(`user_${eventVendor.event.clientId}`).emit('payment:success', { eventVendorId: eventVendor.id });

      return res.status(200).send('OK');
    } catch (error: any) {
      console.error("[PayHere Webhook] Critical Error:", error);
      return res.status(200).send('OK'); 
    }
  }

  // Temporary debug endpoint to check DB state
  static async debugDB(req: any, res: Response) {
    try {
      const evs = await EventVendor.findAll({ limit: 10 });
      const txs = await Transaction.findAll({ limit: 10 });
      const vendors = await Vendor.findAll({ limit: 10 });
      const [evCols] = await EventVendor.sequelize!.query('DESCRIBE event_vendors');
      const [txCols] = await Transaction.sequelize!.query('DESCRIBE transactions');
      
      res.json({
        eventVendors: evs,
        transactions: txs,
        vendors,
        schemas: {
          eventVendors: evCols,
          transactions: txCols
        }
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}

