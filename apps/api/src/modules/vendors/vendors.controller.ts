import { Request, Response } from 'express';
import { Vendor } from '../../database';
import { AuthRequest } from '../../middleware/requireAuth';

export class VendorsController {
  static async createVendor(req: AuthRequest, res: Response) {
    try {
      const { businessName, category, description, basePrice, city } = req.body;
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
        approved: false, // requires admin approval
      });

      res.status(201).json(vendor);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getAll(req: Request, res: Response) {
    try {
      const vendors = await Vendor.findAll({ where: { approved: true } });
      res.json(vendors);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}
