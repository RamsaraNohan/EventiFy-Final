import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { Transaction, Booking, Vendor, Event, EventVendor, User } from '../../database';
import { AuthRequest } from '../../middleware/requireAuth';
import { Response } from 'express';

const router = Router();

router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const role = req.user!.role;

    let where: any = {};
    if (role === 'CLIENT') {
      where.userId = userId;
    } else if (role === 'VENDOR_OWNER') {
      // Find transactions for bookings belonging to this vendor
      const vendors = await Vendor.findAll({ where: { ownerUserId: userId } });
      const vendorIds = vendors.map(v => v.id);
      const bookings = await Booking.findAll({ where: { vendorId: vendorIds } });
      const bookingIds = bookings.map(b => b.id);
      where.bookingId = bookingIds;
    }

    const transactions = await Transaction.findAll({
      where,
      include: [
        { model: Booking, as: 'booking', include: [{ model: Vendor, as: 'vendor', attributes: ['businessName'] }] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(transactions);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/export', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user as any;
    const where: any = {};

    if (user.role === 'CLIENT') where.userId = user.id;
    if (user.role === 'VENDOR_OWNER') {
        const vendor = await Vendor.findOne({ where: { ownerUserId: user.id } });
        if (vendor) {
            const bookings = await Booking.findAll({ where: { vendorId: vendor.id } });
            where.bookingId = bookings.map(b => b.id);
        }
    }
    // ADMIN: no filter — sees everything

    const transactions = await Transaction.findAll({
      where,
      order: [['createdAt', 'DESC']],
      include: [
        { model: User, as: 'user', attributes: ['name', 'email'], required: false },
        { 
          model: Booking, 
          as: 'booking', 
          required: false,
          include: [
            { model: User, as: 'client', attributes: ['name', 'email'] },
            { model: Vendor, as: 'vendor', attributes: ['businessName'] }
          ]
        },
      ],
    });

    let header: string;
    let rows: string[];

    if (user.role === 'CLIENT') {
      header = 'Date,Booking ID,Vendor,Amount (LKR),Type,Status';
      rows = transactions.map((t: any) => [
        new Date(t.createdAt).toLocaleDateString('en-GB'),
        `"${t.bookingId ?? '-'}"`,
        `"${t.booking?.vendor?.businessName ?? '-'}"`,
        t.amount,
        t.type,
        t.status,
      ].join(','));

    } else if (user.role === 'VENDOR_OWNER') {
      header = 'Date,Booking ID,Client,Total (LKR),Status';
      rows = transactions.map((t: any) => {
        return [
          new Date(t.createdAt).toLocaleDateString('en-GB'),
          `"${t.bookingId ?? '-'}"`,
          `"${t.booking?.client?.name ?? '-'}"`,
          t.amount,
          t.status,
        ].join(',');
      });

    } else {
      // ADMIN
      header = 'Date,ID,User,Email,Amount (LKR),Type,Status';
      rows = transactions.map((t: any) => [
        new Date(t.createdAt).toLocaleDateString('en-GB'),
        t.id,
        `"${t.user?.name ?? '-'}"`,
        `"${t.user?.email ?? '-'}"`,
        t.amount,
        t.type,
        t.status,
      ].join(','));
    }

    const csv = [header, ...rows].join('\n');
    const date = new Date().toISOString().split('T')[0];
    const filename = `eventify-transactions-${date}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    res.status(200).send(csv);

  } catch (err: any) {
    console.error('[CSV Export] Error:', err?.message, err?.stack);
    res.status(500).json({ message: 'Export failed' });
  }
});

export default router;
