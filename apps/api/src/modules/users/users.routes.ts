import { Router } from 'express';
import { UsersController } from './users.controller';
import { requireAuth } from '../../middleware/requireAuth';
import { upload } from '../../utils/uploads';

const router = Router();

router.use(requireAuth);

router.get('/', UsersController.getAll);
router.patch('/:id/role', UsersController.updateRole);
router.get('/me', UsersController.getMe);
router.put('/me', UsersController.updateMe);
router.post('/me/avatar', upload.single('avatar'), UsersController.uploadAvatar);

export default router;
