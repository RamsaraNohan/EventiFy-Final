import { Router } from 'express';
import { SavedVendorsController } from './saved-vendors.controller';
import { requireAuth } from '../../middleware/requireAuth';

const router = Router();

router.use(requireAuth);

router.get('/', SavedVendorsController.getSavedVendors);
router.post('/', SavedVendorsController.saveVendor);
router.delete('/:vendorId', SavedVendorsController.unsaveVendor);

export default router;
