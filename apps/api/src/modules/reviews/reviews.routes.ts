import { Router } from 'express';
import { ReviewsController } from './reviews.controller';
import { requireAuth } from '../../middleware/requireAuth';

const router = Router();

router.use(requireAuth);

router.get('/:vendorId', ReviewsController.getVendorReviews);
router.post('/', ReviewsController.createReview);
router.delete('/:id', ReviewsController.deleteReview);

export default router;
