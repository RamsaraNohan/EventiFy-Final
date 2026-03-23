import { Router } from 'express';
import { AuthController } from './auth.controller';
import { requireAuth } from '../../middleware/requireAuth';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/logout', AuthController.logout);
router.get('/me', requireAuth, AuthController.me);
router.put('/update', requireAuth, AuthController.updateProfile);
router.put('/change-password', requireAuth, AuthController.changePassword);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);

export default router;
