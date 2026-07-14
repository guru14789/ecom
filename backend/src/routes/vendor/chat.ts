import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest, authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { sendMessage, getChatsForUser, markChatRead } from '../../lib/firestore/chats';
import { AppError } from '../../utils/errors';

const router = Router();
router.use(authenticate);
router.use(authorize('vendor', 'vendor_admin', 'platform_admin'));

// Get all chats for vendor
router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const chats = await getChatsForUser(req.user!.sub, 'vendor');
    res.json({ success: true, data: chats });
  } catch (err) {
    next(err);
  }
});

// Send a message
router.post('/:chatId/messages', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { chatId } = req.params;
    const { text } = req.body;
    if (!text) throw new AppError('VALIDATION_ERROR', 'Message text is required', 400);

    await sendMessage(chatId, req.user!.sub, 'vendor', text);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// Mark chat as read
router.put('/:chatId/read', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await markChatRead(req.params.chatId, 'vendor');
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
