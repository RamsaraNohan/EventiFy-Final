import { Router } from 'express';
import { BookingsController } from './bookings.controller';
import { requireAuth } from '../../middleware/requireAuth';

const router = Router();

router.use(requireAuth);

router.post('/', BookingsController.createBooking);

export default router;
