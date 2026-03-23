import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Vendor, PasswordReset } from '../../database';
import { env } from '../../config/env';
import { AuthRequest } from '../../middleware/requireAuth';
import crypto from 'crypto';
import { Op } from 'sequelize';
import { EmailService } from '../../utils/email';

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

      // Send Welcome Email
      EmailService.sendWelcomeEmail(user.email, user.name).catch(console.error);

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
    try {
      const user = await User.findByPk(req.user!.id, {
        attributes: { exclude: ['passwordHash'] }
      });
      if (!user) return res.status(404).json({ message: 'User not found' });
      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatarUrl: user.avatarUrl || null,
          phone: user.phone || null,
        }
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async updateProfile(req: AuthRequest, res: Response) {
    try {
      const { name, email } = req.body;
      const user = await User.findByPk(req.user!.id);
      if (!user) return res.status(404).json({ message: 'User not found' });

      await user.update({ name, email });
      res.json({ message: 'Profile updated', user: { id: user.id, name: user.name, email: user.email } });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async changePassword(req: AuthRequest, res: Response) {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await User.findByPk(req.user!.id);
      if (!user) return res.status(404).json({ message: 'User not found' });

      const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValid) return res.status(401).json({ message: 'Invalid current password' });

      const passwordHash = await bcrypt.hash(newPassword, 10);
      await user.update({ passwordHash });
      res.json({ message: 'Password changed successfully' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;
      const user = await User.findOne({ where: { email } });
      if (!user) {
        // Return 200 even if user not found to prevent email enumeration
        return res.json({ message: 'If that email exists, a reset link was sent.' });
      }

      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = await bcrypt.hash(token, 10);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await PasswordReset.create({
        userId: user.id,
        tokenHash,
        expiresAt,
        used: false
      });

      const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
      await EmailService.sendPasswordReset(email, token);

      res.json({ message: 'If that email exists, a reset link was sent.' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async resetPassword(req: Request, res: Response) {
    try {
      const { email, token, newPassword } = req.body;
      const user = await User.findOne({ where: { email } });
      if (!user) return res.status(400).json({ message: 'Invalid or expired token.' });

      const resets = await PasswordReset.findAll({
        where: {
          userId: user.id,
          used: false,
          expiresAt: { [Op.gt]: new Date() }
        }
      });

      let validReset = null;
      for (const reset of resets) {
        const isValid = await bcrypt.compare(token, reset.tokenHash);
        if (isValid) {
          validReset = reset;
          break;
        }
      }

      if (!validReset) {
        return res.status(400).json({ message: 'Invalid or expired token.' });
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);
      await user.update({ passwordHash });
      await validReset.update({ used: true });

      // Invalidate all other pending tokens for security
      await PasswordReset.update({ used: true }, { where: { userId: user.id, used: false } });

      res.json({ message: 'Password has been reset successfully.' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}
