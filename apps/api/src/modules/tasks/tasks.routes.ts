import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { TasksController } from './tasks.controller';

import { getCloudinaryUpload } from '../../utils/uploads';

const router = Router();

// Get tasks for an event-vendor relationship
router.get('/event-vendor/:eventVendorId', requireAuth, TasksController.getTasksForEventVendor);
router.post('/event-vendor/:eventVendorId', requireAuth, TasksController.createTask);

// Update/delete individual task
router.patch('/:taskId', requireAuth, getCloudinaryUpload('tasks').array('files', 3), TasksController.updateTask);
router.delete('/:taskId', requireAuth, TasksController.deleteTask);

export default router;
