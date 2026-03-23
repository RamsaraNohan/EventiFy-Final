import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { EventsController } from './events.controller';

const router = Router();

// ⚠️ IMPORTANT: Specific routes MUST come before parameterized /:id routes

// Admin: get all events (MUST be before parameterized routes)
router.get('/admin/all', requireAuth, EventsController.getAllEventsForAdmin);

// Vendor: get their event bookings (MUST be before /:id)
router.get('/vendor/mine', requireAuth, EventsController.getVendorEvents);

// Vendor: respond to booking (MUST be before /:id)
router.patch('/vendor/:eventVendorId/respond', requireAuth, EventsController.respondToBooking);

// Client routes
router.get('/', requireAuth, EventsController.getMyEvents);
router.post('/', requireAuth, EventsController.createEvent);
router.get('/:id', requireAuth, EventsController.getEventById);
router.put('/:id', requireAuth, EventsController.updateEvent);
router.delete('/:id', requireAuth, EventsController.deleteEvent);

// Add/Remove vendor to event
router.post('/:id/vendors', requireAuth, EventsController.addVendorToEvent);
router.delete('/:id/vendors/:eventVendorId', requireAuth, EventsController.removeVendorFromEvent);

export default router;
