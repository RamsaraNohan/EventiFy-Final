import { Router } from 'express';
import { PaymentsController } from './payments.controller';
import { requireAuth } from '../../middleware/requireAuth';

import transactionsRoutes from './transactions.routes';

const router = Router();

// Old booking-based checkout (kept for backward compat)
router.get('/checkout/:bookingId', requireAuth, PaymentsController.createCheckoutSession);

// New event-vendor based checkout (advance payment)
router.get('/checkout/event-vendor/:eventVendorId', requireAuth, PaymentsController.createEventVendorCheckout);

// PayHere Webhook (Notify URL) should be public
router.post('/notify', PaymentsController.notify);

// Transaction History
router.use('/transactions', transactionsRoutes);

export default router;
