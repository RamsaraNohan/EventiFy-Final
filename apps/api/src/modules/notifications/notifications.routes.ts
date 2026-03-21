import { Router } from 'express';
import { NotificationsController } from './notifications.controller';
import { requireAuth } from '../../middleware/requireAuth';

const router = Router();

router.use(requireAuth);

router.get('/', NotificationsController.getNotifications);
router.post('/mark-all-read', NotificationsController.markAllRead);

export default router;
