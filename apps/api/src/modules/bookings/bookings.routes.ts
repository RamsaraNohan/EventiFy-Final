import { Router } from 'express';
import { BookingsController } from './bookings.controller';
import { requireAuth } from '../../middleware/requireAuth';

const router = Router();

router.use(requireAuth);

router.post('/', BookingsController.createBooking);
router.get('/client', BookingsController.getClientBookings);
router.get('/vendor', BookingsController.getVendorBookings);
router.patch('/:id/status', BookingsController.updateBookingStatus);

export default router;
