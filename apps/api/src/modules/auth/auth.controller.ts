import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Vendor } from '../../database';
import { env } from '../../config/env';
import { AuthRequest } from '../../middleware/requireAuth';

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const { email, password, name, role } = req.body;

      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already exists' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await User.create({
        email,
        passwordHash,
        name,
        role: role || 'CLIENT',
      });

      // If requested as vendor, optionally auto-create minimal vendor profile
      // For full flow, they should call POST /vendors instead, but let's just make the user.

      const token = jwt.sign({ id: user.id }, env.JWT_SECRET, { expiresIn: '7d' });

      res.cookie('token', token, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(201).json({
        user: { id: user.id, email: user.email, name: user.name, role: user.role }
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ where: { email } });
      if (!user) return res.status(401).json({ message: 'Invalid credentials' });

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) return res.status(401).json({ message: 'Invalid credentials' });

      const token = jwt.sign({ id: user.id }, env.JWT_SECRET, { expiresIn: '7d' });

      res.cookie('token', token, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        user: { id: user.id, email: user.email, name: user.name, role: user.role }
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async logout(req: Request, res: Response) {
    res.clearCookie('token');
    res.json({ message: 'Logged out' });
  }

  static async me(req: AuthRequest, res: Response) {
    res.json({
      user: {
        id: req.user!.id,
        email: req.user!.email,
        name: req.user!.name,
        role: req.user!.role,
      }
    });
  }
}
