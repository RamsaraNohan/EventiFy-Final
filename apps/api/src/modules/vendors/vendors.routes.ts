import { Router } from 'express';
import { VendorsController } from './vendors.controller';
import { requireAuth } from '../../middleware/requireAuth';
import { upload } from '../../utils/uploads';

const router = Router();

// ⚠️ IMPORTANT: Specific routes MUST come before parameterized /:id routes
router.post('/', requireAuth, VendorsController.createVendor);
router.get('/', VendorsController.getAll);
router.get('/me', requireAuth, VendorsController.getMe);
router.get('/pending', requireAuth, VendorsController.getPending);
router.get('/metrics', requireAuth, VendorsController.getMetrics);  // ← MUST be before /:id

// Parameterized routes (must come after named routes above)
router.get('/:id', VendorsController.getById);
router.put('/:id', requireAuth, VendorsController.update);
router.patch('/:id/status', requireAuth, VendorsController.updateStatus);
router.post('/:id/images', requireAuth, upload.array('images', 5), VendorsController.uploadImages);
router.delete('/:id/images', requireAuth, VendorsController.deleteImage);

export default router;
