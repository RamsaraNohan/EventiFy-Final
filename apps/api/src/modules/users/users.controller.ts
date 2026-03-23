import { Response } from 'express';
import { User } from '../../database';
import { AuthRequest } from '../../middleware/requireAuth';

export class UsersController {

  static async getMe(req: AuthRequest, res: Response) {
    try {
      const user = await User.findByPk(req.user!.id, {
        attributes: { exclude: ['passwordHash'] }
      });
      if (!user) return res.status(404).json({ message: 'User not found' });
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async updateMe(req: AuthRequest, res: Response) {
    try {
      const { name, phone, bio } = req.body;
      const user = await User.findByPk(req.user!.id);
      if (!user) return res.status(404).json({ message: 'User not found' });
      await user.update({ name, phone, bio });
      res.json({ id: user.id, name: user.name, phone: user.phone, bio: user.bio, avatarUrl: user.avatarUrl });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async uploadAvatar(req: AuthRequest, res: Response) {
    try {
      if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
      // Cloudinary storage provides the full URL as 'path'
      const avatarUrl = req.file.path;
      const user = await User.findByPk(req.user!.id);
      if (!user) return res.status(404).json({ message: 'User not found' });
      await user.update({ avatarUrl });
      res.json({ avatarUrl });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getAll(req: AuthRequest, res: Response) {
    try {
      const { q, role } = req.query;
      const where: any = {};
      
      if (q) {
        const { Op } = require('sequelize');
        where[Op.or] = [
          { name: { [Op.like]: `%${q}%` } },
          { email: { [Op.like]: `%${q}%` } }
        ];
      }
      if (role) where.role = role;

      const users = await User.findAll({
        where,
        attributes: ['id', 'name', 'role', 'avatarUrl'],
        limit: 20,
        order: [['name', 'ASC']]
      });
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async updateRole(req: AuthRequest, res: Response) {
    try {
      if (req.user!.role !== 'ADMIN') return res.status(403).json({ message: 'Admin access required' });
      const { id } = req.params;
      const { role } = req.body;
      if (!['CLIENT', 'VENDOR_OWNER', 'ADMIN'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }
      const user = await User.findByPk(id);
      if (!user) return res.status(404).json({ message: 'User not found' });
      user.role = role;
      await user.save();
      res.json({ id: user.id, role: user.role });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}
