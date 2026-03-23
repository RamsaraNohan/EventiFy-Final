import { Response } from 'express';
import { SavedVendor, Vendor, User } from '../../database';
import { AuthRequest } from '../../middleware/requireAuth';

export class SavedVendorsController {
  
  static async saveVendor(req: AuthRequest, res: Response) {
    try {
      const { vendorId } = req.body;
      const userId = req.user!.id;

      const [saved, created] = await SavedVendor.findOrCreate({
        where: { userId, vendorId }
      });

      res.status(created ? 201 : 200).json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async unsaveVendor(req: AuthRequest, res: Response) {
    try {
      const { vendorId } = req.params;
      const userId = req.user!.id;

      await SavedVendor.destroy({
        where: { userId, vendorId }
      });

      res.json({ success: true, message: 'Vendor unsaved' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getSavedVendors(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const saved = await SavedVendor.findAll({
        where: { userId },
        include: [
          { 
            model: Vendor, 
            as: 'vendor',
            include: [{ model: User, as: 'owner', attributes: ['name', 'avatarUrl'] }]
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}
