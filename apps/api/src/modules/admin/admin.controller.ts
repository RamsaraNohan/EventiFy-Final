import { Response } from 'express';
import { AuthRequest } from '../../middleware/requireAuth';
import { User, Vendor, Booking, Transaction, EventVendor, Notification, Event } from '../../database';
import { io } from '../../socket';
import { Op } from 'sequelize';
import { format } from 'date-fns';
import { EmailService } from '../../utils/email';
import { PayoutService } from '../../services/payout.service';

export class AdminController {
  
  static async getUsers(req: AuthRequest, res: Response) {
    try {
      const { role, page = 1, limit = 20 } = req.query;
      const where: any = {};
      if (role) where.role = role;
      

      const users = await User.findAndCountAll({
        where,
        include: [{ model: Vendor, as: 'vendorProfile', required: false }],
        limit: Number(limit),
        offset: (Number(page) - 1) * Number(limit),
        order: [['createdAt', 'DESC']]
      });

      res.json(users);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async updateUser(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { role, active } = req.body;

      const user = await User.findByPk(id);
      if (!user) return res.status(404).json({ message: 'User not found' });

      await user.update({ role, active });
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getPendingVendors(req: AuthRequest, res: Response) {
    try {
      const vendors = await Vendor.findAll({
        where: { approved: false },
        include: [{ model: User, as: 'owner', attributes: ['id', 'name', 'email', 'avatarUrl'] }]
      });
      res.json(vendors);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async approveVendor(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const vendor = await Vendor.findByPk(id, { include: [{ model: User, as: 'owner' }] }) as any;
      if (!vendor) return res.status(404).json({ message: 'Vendor not found' });

      await vendor.update({ approved: true });

      // Send Email
      if (vendor.owner?.email) {
        EmailService.sendVendorApproved(vendor.owner.email, vendor.businessName).catch(console.error);
      }

      res.json({ message: 'Vendor approved', vendor });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async rejectVendor(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const vendor = await Vendor.findByPk(id, { include: [{ model: User, as: 'owner' }] }) as any;
      if (!vendor) return res.status(404).json({ message: 'Vendor not found' });

      // Send Email
      if (vendor.owner?.email) {
        EmailService.sendVendorRejected(vendor.owner.email, vendor.businessName, reason).catch(console.error);
      }

      res.json({ message: 'Vendor rejected and notified' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getTransactions(req: AuthRequest, res: Response) {
    try {
      const transactions = await Transaction.findAll({
        include: [
          { model: User, as: 'user', attributes: ['name', 'email'] },
          { model: Booking, as: 'booking', required: false },
        ],
        order: [['createdAt', 'DESC']]
      });
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async payoutVendor(req: AuthRequest, res: Response) {
    try {
      const { transactionId } = req.params;
      const transaction = await Transaction.findByPk(transactionId) as any;
      
      if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
      if (transaction.status === 'PAID_TO_VENDOR') {
        return res.status(400).json({ message: 'Commission already paid' });
      }

      // Calculate split of the 50% advance: 
      // Platform keep 10% of total (which is 20% of the advance)
      // Vendor gets 40% of total (which is 80% of the advance)
      const paidAmount = Number(transaction.amount);
      const vendorShareAmount = Math.round(paidAmount * 0.8);
      const platformFee = paidAmount - vendorShareAmount;

      // Mark original transaction as paid out
      await transaction.update({ status: 'PAID_TO_VENDOR', platformFee });

      // Find the vendor and create a PAYOUT Transaction for their earnings tab
      const metadata = transaction.metadata;
      let vendorOwnerId: string | null = null;
      let vendorId: string | null = null;

      let payoutStatus = 'COMPLETED';
      let externalTxId = 'INTERNAL_' + Date.now();

      if (metadata?.eventVendorId) {
        const ev = await EventVendor.findByPk(metadata.eventVendorId, {
          include: [{ model: Vendor, as: 'vendor' }]
        }) as any;

        if (ev?.vendor) {
          const vendorRecord = ev.vendor;
          vendorOwnerId = vendorRecord.ownerUserId;
          vendorId = vendorRecord.id;

          // Trigger actual PayHere Payout if bank details exist
          if (vendorRecord.bankName && vendorRecord.accountNumber && vendorRecord.bankCode && vendorRecord.branchCode) {
            const payoutResponse = await PayoutService.transfer({
              transferId: `PAYOUT_${transaction.id}`,
              amount: vendorShareAmount,
              currency: transaction.currency || 'LKR',
              bankCode: vendorRecord.bankCode,
              branchCode: vendorRecord.branchCode,
              accountNumber: vendorRecord.accountNumber,
              accountName: vendorRecord.accountName || vendorRecord.businessName,
              description: `Payout for booking #${transaction.bookingId || transaction.id}`
            });

            if (!payoutResponse.success) {
              console.error(`[Admin] PayHere Transfer failed for transaction ${transaction.id}: ${payoutResponse.message}`);
              payoutStatus = 'FAILED';
            } else {
              externalTxId = payoutResponse.data?.payment_id || externalTxId;
            }
          }

          // Create a PAYOUT transaction so vendor sees it in their Earnings tab
          await Transaction.create({
            bookingId: transaction.bookingId,
            userId: vendorOwnerId,
            amount: vendorShareAmount,
            currency: transaction.currency || 'LKR',
            provider: 'PAYHERE',
            providerTransactionId: externalTxId,
            status: payoutStatus,
            type: 'PAYOUT',
            metadata: { 
              sourceTransactionId: transaction.id, 
              vendorId,
              eventVendorId: metadata.eventVendorId,
              platformFee: transaction.amount - vendorShareAmount 
            }
          });

          // Notify vendor via socket and notification
          const notif = await Notification.create({
            userId: vendorOwnerId,
            type: 'BOOKING_UPDATE',
            title: 'Payout Processed',
            body: payoutStatus === 'COMPLETED' 
              ? `Admin has processed your payout for transaction #${transaction.id.substring(0,8)}`
              : `There was an issue processing your payout for #${transaction.id.substring(0,8)}. We will contact you.`,
            href: `/transactions`
          });
          io.to(`user_${vendorOwnerId}`).emit('notification:new', notif);
          io.to(`user_${vendorOwnerId}`).emit('transaction:update', { transactionId: transaction.id });

          // Send Email only if successful
          if (payoutStatus === 'COMPLETED') {
            const vendorUser = await User.findByPk(vendorOwnerId as string);
            if (vendorUser) {
              EmailService.sendPayoutProcessed(vendorUser.email, vendorUser.name, vendorShareAmount).catch(console.error);
            }
          }
        }
      }

      res.json({ message: payoutStatus === 'COMPLETED' ? 'Payout processed successfully' : 'Payout transaction created with failure status', transaction });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getMetrics(req: AuthRequest, res: Response) {
    try {
      const userCount = await User.count({ where: { role: { [Op.ne]: 'ADMIN' } } });
      const vendorCount = await Vendor.count({ where: { approved: true } });
      const eventCount = await Event.count();
      const activeEvents = await Event.count({ where: { status: { [Op.in]: ['ONGOING', 'EVENT_SOON'] } } });
      const completedEvents = await Event.count({ where: { status: 'COMPLETED' } });
      const totalGross = await Transaction.sum('amount', { where: { status: { [Op.in]: ['COMPLETED', 'PAID_TO_VENDOR'] } } });
      const totalRevenue = (totalGross || 0) * 0.8;

      // Growth data (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const userGrowth = await User.findAll({
        attributes: [
          [User.sequelize!.fn('DATE_FORMAT', User.sequelize!.col('createdAt'), '%Y-%m'), 'month'],
          [User.sequelize!.fn('COUNT', User.sequelize!.col('id')), 'count']
        ],
        where: { createdAt: { [Op.gte]: sixMonthsAgo } },
        group: ['month'],
        order: [['month', 'ASC']],
        raw: true
      });

      const revenueGrowth = await Transaction.findAll({
        attributes: [
          [Transaction.sequelize!.fn('DATE_FORMAT', Transaction.sequelize!.col('createdAt'), '%Y-%m'), 'month'],
          [Transaction.sequelize!.fn('SUM', Transaction.sequelize!.col('amount')), 'total']
        ],
        where: { 
          createdAt: { [Op.gte]: sixMonthsAgo },
          status: { [Op.in]: ['COMPLETED', 'PAID_TO_VENDOR'] }
        },
        group: ['month'],
        order: [['month', 'ASC']],
        raw: true
      });

      const vendorStats = await Vendor.findAll({
        attributes: ['category', [Vendor.sequelize!.fn('COUNT', Vendor.sequelize!.col('id')), 'count']],
        group: ['category'],
        raw: true
      });

      res.json({
        overview: {
          users: userCount,
          vendors: vendorCount,
          events: eventCount, // alias for totalEvents for backward compatibility if needed
          totalEvents: eventCount,
          activeEvents,
          completedEvents,
          revenue: totalRevenue || 0
        },
        charts: {
          userGrowth,
          revenueGrowth,
          vendorStats
        }
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async exportTransactions(_req: AuthRequest, res: Response) {
    try {
      const transactions = await Transaction.findAll({
        include: [{ model: User, as: 'user', attributes: ['name', 'email'] }],
        order: [['createdAt', 'DESC']]
      }) as any[];

      const headers = ['ID', 'Date', 'Type', 'Amount', 'Currency', 'Status', 'User', 'Email', 'Provider', 'ProviderTxID'];
      const rows = transactions.map(t => [
        t.id,
        format(new Date(t.createdAt), 'yyyy-MM-dd HH:mm'),
        t.type,
        t.amount,
        t.currency,
        t.status,
        t.user?.name || 'N/A',
        t.user?.email || 'N/A',
        t.provider,
        t.providerTransactionId || ''
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=transactions_export.csv');
      res.status(200).send(csvContent);
    } catch (error: any) {
      console.error('Export failed:', error);
      res.status(500).json({ message: 'Export failed' });
    }
  }

  static async getRecentActivity(req: AuthRequest, res: Response) {
    try {
      const limit = Number(req.query.limit ?? 10);

      // Combine recent records from multiple tables
      const [bookings, payments, users, reviews] = await Promise.all([
        Booking.findAll({
          limit: 5, order: [['createdAt', 'DESC']],
          include: [
            { model: User, as: 'client', attributes: ['name'] },
            { model: Vendor, as: 'vendor', attributes: ['businessName'] },
          ],
        }),
        Transaction.findAll({
          limit: 5, order: [['createdAt', 'DESC']],
          include: [{ model: User, as: 'user', attributes: ['name'] }],
        }),
        User.findAll({ limit: 5, order: [['createdAt', 'DESC']], attributes: ['id', 'name', 'role', 'createdAt'] }),
        Vendor.findAll({ 
          limit: 5, order: [['createdAt', 'DESC']], 
          include: [{ model: User, as: 'owner', attributes: ['name'] }] 
        }),
      ]);

      const activity = [
        ...bookings.map((b: any) => ({
          id: `b-${b.id}`,
          type: 'booking',
          title: 'Squad Deployment',
          description: `${b.client?.name ?? 'Client'} booked ${b.vendor?.businessName ?? 'a vendor'}`,
          timestamp: b.createdAt,
        })),
        ...payments.map((p: any) => ({
          id: `p-${p.id}`,
          type: 'payment',
          title: 'Capital Flow',
          description: `Transaction of LKR ${Number(p.amount).toLocaleString()} from ${p.user?.name ?? 'client'}`,
          timestamp: p.createdAt,
        })),
        ...users.map((u: any) => ({
          id: `u-${u.id}`,
          type: 'user_reg',
          title: 'Nexus Onboarding',
          description: u.role === 'ADMIN' ? `New admin registered: ${u.name}` : `New user joined: ${u.name} (${u.role})`,
          timestamp: u.createdAt,
        })),
      ]
        .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);

      res.json({ success: true, data: activity });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  }

  static async testEmail(req: AuthRequest, res: Response) {
    try {
      const { email } = req.body;
      const adminName = req.user?.name || 'Admin';
      
      if (!email) return res.status(400).json({ message: 'Recipient email is required' });

      await EmailService.sendTestEmail(email, adminName);
      res.json({ success: true, message: `Test email dispatched to ${email}` });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}
