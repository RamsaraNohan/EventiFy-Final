import { Router } from 'express';
import { CalendarController } from './calendar.controller';
import { requireAuth } from '../../middleware/requireAuth';

const router = Router();

router.get('/:vendorId', CalendarController.getVendorAvailability);
router.post('/block', requireAuth, CalendarController.blockDate);
router.delete('/:id', requireAuth, CalendarController.unblockDate);

export default router;
