import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import * as conversationsController from './conversations.controller';
import { upload } from '../../utils/uploads';

const router = Router();

router.use(requireAuth);

router.get('/with-meta', conversationsController.getConversationsWithMeta);
router.get('/unread-count', conversationsController.getUnreadCount);
router.post('/', conversationsController.createConversation);
router.post('/upload', upload.single('file'), (req: any, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ url });
});
router.get('/:conversationId/messages', conversationsController.getMessages);
router.post('/:conversationId/messages', conversationsController.createMessage);
router.patch('/:conversationId/messages/:messageId/read', conversationsController.markAsRead);
router.patch('/:conversationId/read-all', conversationsController.markAllAsRead);

export default router;
