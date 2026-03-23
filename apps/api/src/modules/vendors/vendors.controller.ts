import { Request, Response } from 'express';
import { Vendor, User, Transaction, EventVendor, Review, Event, CalendarAvailability, sequelize } from '../../database';
import { AuthRequest } from '../../middleware/requireAuth';
import { Op } from 'sequelize';

export class VendorsController {
  static async createVendor(req: AuthRequest, res: Response) {
    try {
      const { businessName, category, description, basePrice, city, services } = req.body;
      const ownerUserId = req.user!.id;

      let vendor = await Vendor.findOne({ where: { ownerUserId } });
      if (vendor) {
        return res.status(400).json({ message: 'User already owns a vendor profile' });
      }

      vendor = await Vendor.create({
        ownerUserId,
        businessName,
        category,
        description,
        basePrice,
        city,
        services,
        approved: false, // Must be approved by admin before showing in marketplace
      });

      res.status(201).json(vendor);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getAll(req: Request, res: Response) {
    try {
      const vendors = await Vendor.findAll({ 
        where: { approved: true },
        attributes: [
          'id', 'ownerUserId', 'businessName', 'category', 'city', 'basePrice', 'description', 'gallery', 'promotions', 'createdAt',
          'bankName', 'accountName', 'accountNumber',
          [sequelize.fn('AVG', sequelize.col('reviews.rating')), 'rating'],
          [sequelize.fn('COUNT', sequelize.col('reviews.id')), 'reviewCount']
        ],
        include: [{ 
          model: Review, 
          as: 'reviews', 
          attributes: [] 
        }],
        group: ['Vendor.id']
      });
      res.json(vendors);
    } catch (error: any) {
      console.error('[getAll Vendors]', error);
      res.status(500).json({ message: error.message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const vendor = await Vendor.findByPk(id, {
        attributes: [
          'id', 'ownerUserId', 'businessName', 'category', 'city', 'basePrice', 'description', 'gallery', 'promotions', 'createdAt', 'updatedAt', 'services', 'approved',
          'bankName', 'accountName', 'accountNumber',
          [sequelize.fn('AVG', sequelize.col('reviews.rating')), 'rating'],
          [sequelize.fn('COUNT', sequelize.col('reviews.id')), 'reviewCount']
        ],
        include: [
          { model: User, as: 'owner', attributes: ['id', 'name', 'email'] },
          { model: Review, as: 'reviews', attributes: [] },
          { model: CalendarAvailability, as: 'availabilities', attributes: ['blockedDate', 'notes'] }
        ],
        group: ['Vendor.id', 'owner.id', 'availabilities.id']
      });

      if (!vendor) {
        return res.status(404).json({ message: 'Vendor not found' });
      }

      res.json(vendor);
    } catch (error: any) {
      console.error('[getById Vendor]', error);
      res.status(500).json({ message: error.message });
    }
  }

  // Admin Methods
  static async getPending(req: AuthRequest, res: Response) {
    try {
      if (req.user!.role !== 'ADMIN') return res.status(403).json({ message: 'Admin access required' });
      
      const vendors = await Vendor.findAll({
        where: { approved: false },
        include: [{ model: User, as: 'owner', attributes: ['id', 'name', 'email'] }]
      });
      res.json(vendors);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async updateStatus(req: AuthRequest, res: Response) {
    try {
      if (req.user!.role !== 'ADMIN') return res.status(403).json({ message: 'Admin access required' });
      
      const { id } = req.params;
      const { approved } = req.body;

      const vendor = await Vendor.findByPk(id);
      if (!vendor) return res.status(404).json({ message: 'Vendor not found' });

      vendor.approved = approved;
      await vendor.save();

      res.json(vendor);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getMe(req: AuthRequest, res: Response) {
    try {
      const vendor = await Vendor.findOne({ where: { ownerUserId: req.user!.id } });
      if (!vendor) return res.json(null); // Return 200 with null
      res.json(vendor);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async update(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { businessName, category, description, basePrice, city, promotions, gallery, bankName, accountName, accountNumber } = req.body;
      const vendor = await Vendor.findByPk(id);

      if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
      if (vendor.ownerUserId !== req.user!.id && req.user!.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      await vendor.update({ businessName, category, description, basePrice, city, promotions, gallery, bankName, accountName, accountNumber });
      res.json(vendor);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async uploadImages(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const vendor = await Vendor.findByPk(id);

      if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
      if (vendor.ownerUserId !== req.user!.id && req.user!.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      if (!req.files || !(req.files as any).length) {
        return res.status(400).json({ message: 'No files uploaded' });
      }

      const files = req.files as Express.Multer.File[];
      const imageUrls = files.map(file => file.path);

      const currentGallery = vendor.gallery || [];
      const updatedGallery = [...currentGallery, ...imageUrls];

      await vendor.update({ gallery: updatedGallery });
      res.json({ message: 'Images uploaded successfully', gallery: updatedGallery });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async deleteImage(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { imageUrl } = req.body;
      const vendor = await Vendor.findByPk(id);

      if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
      if (vendor.ownerUserId !== req.user!.id && req.user!.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      const currentGallery = vendor.gallery || [];
      const updatedGallery = currentGallery.filter((url: string) => url !== imageUrl);

      await vendor.update({ gallery: updatedGallery });
      res.json({ message: 'Image deleted successfully', gallery: updatedGallery });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getMetrics(req: AuthRequest, res: Response) {
    try {
      const { period = 'monthly' } = req.query;
      const vendor = await Vendor.findOne({ where: { ownerUserId: req.user!.id } });
      if (!vendor) return res.json({ totalEarnings: 0, upcomingEvents: 0, activeBookings: 0, recentRevenue: 0 });

      // Calculate total earnings
      const earningsResult = await Transaction.findOne({
        where: {
          userId: vendor.ownerUserId,
          type: 'PAYOUT',
          status: 'COMPLETED'
        },
        attributes: [[sequelize.fn('SUM', sequelize.col('amount')), 'totalEarnings']],
        raw: true
      }) as any;

      const totalEarnings = Number(earningsResult?.totalEarnings || 0);

      const activeBookings = await EventVendor.count({
        where: { vendorId: vendor.id, status: 'PENDING' }
      });

      const upcomingEvents = await EventVendor.count({
        where: {
          vendorId: vendor.id,
          status: { [Op.in]: ['APPROVED', 'ADVANCE_PAID'] },
        },
        include: [{
          model: Event,
          as: 'event',
          where: { date: { [Op.gte]: new Date() } }
        }]
      });

      // Period-based earnings
      let dateFormat = '%Y-%m';
      let startDate = new Date();
      
      if (period === 'daily') {
        dateFormat = '%Y-%m-%d';
        startDate.setDate(startDate.getDate() - 14); // Last 14 days
      } else if (period === 'weekly') {
        dateFormat = '%x-%v'; // Year-Week
        startDate.setDate(startDate.getDate() - 70); // Last 10 weeks
      } else {
        startDate.setMonth(startDate.getMonth() - 6); // Last 6 months
      }

      const earningsHistory = await Transaction.findAll({
        attributes: [
          [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), dateFormat), 'label'],
          [sequelize.fn('SUM', sequelize.col('amount')), 'amount']
        ],
        where: {
          userId: vendor.ownerUserId,
          type: 'PAYOUT',
          status: 'COMPLETED',
          createdAt: { [Op.gte]: startDate }
        },
        group: ['label'],
        order: [['label', 'ASC']],
        raw: true
      });

      res.json({
        totalEarnings,
        upcomingEvents,
        activeBookings, 
        recentRevenue: totalEarnings,
        chartData: earningsHistory.map((h: any) => ({
          month: h.label, // Keep naming consistent with frontend expectation or update frontend
          total: Number(h.amount)
        }))
      });
    } catch (error: any) {
      console.error('[Vendor Metrics]', error);
      res.status(500).json({ message: error.message });
    }
  }
}
