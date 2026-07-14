import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest, authenticate } from '../../middleware/authenticate';
import { getOrCreateChat, sendMessage, getChatsForUser, markChatRead } from '../../lib/firestore/chats';
import { getUserById } from '../../lib/firestore/users';
import { getVendorByUserId } from '../../lib/firestore/vendors';
import { AppError } from '../../utils/errors';

const router = Router();
router.use(authenticate);

// Get all chats for buyer
router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const chats = await getChatsForUser(req.user!.sub, 'buyer');
    res.json({ success: true, data: chats });
  } catch (err) {
    next(err);
  }
});

// Initiate or get chat with a vendor
router.post('/initiate', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { vendorId } = req.body;
    if (!vendorId) throw new AppError('VALIDATION_ERROR', 'Vendor ID is required', 400);

    const buyer = await getUserById(req.user!.sub);
    const vendor = await getVendorByUserId(vendorId);

    if (!buyer || !vendor) {
      throw new AppError('NOT_FOUND', 'Buyer or Vendor not found', 404);
    }

    const chat = await getOrCreateChat(
      req.user!.sub,
      vendorId,
      buyer.displayName || buyer.name || 'Buyer',
      vendor.businessName || 'Vendor'
    );

    res.json({ success: true, data: chat });
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

    await sendMessage(chatId, req.user!.sub, 'buyer', text);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// Mark chat as read
router.put('/:chatId/read', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await markChatRead(req.params.chatId, 'buyer');
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
