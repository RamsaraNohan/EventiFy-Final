import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { AdminController } from './admin.controller';

const router = Router();

// Middleware to ensure admin role
const requireAdmin = (req: any, res: any, next: any) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Forbidden: Admin access required' });
  }
  next();
};

router.use(requireAuth, requireAdmin);

router.get('/users', AdminController.getUsers);
router.patch('/users/:id', AdminController.updateUser);
router.get('/vendors/pending', AdminController.getPendingVendors);
router.post('/vendors/:id/approve', AdminController.approveVendor);
router.post('/vendors/:id/reject', AdminController.rejectVendor);
router.get('/metrics', AdminController.getMetrics);
router.get('/transactions', AdminController.getTransactions);
router.get('/transactions/export', AdminController.exportTransactions);
router.post('/transactions/:transactionId/payout', AdminController.payoutVendor);
router.get('/activity', AdminController.getRecentActivity);
router.post('/test-email', AdminController.testEmail);

export default router;
