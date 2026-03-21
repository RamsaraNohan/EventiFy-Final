import { Router } from 'express';
import { VendorsController } from './vendors.controller';
import { requireAuth } from '../../middleware/requireAuth';

const router = Router();

router.post('/', requireAuth, VendorsController.createVendor);
router.get('/', VendorsController.getAll);

export default router;
