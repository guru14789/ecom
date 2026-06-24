import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authenticate';
import {
  getProfile, updateProfile,
  getAddresses, addAddress, updateAddress, deleteAddress,
  getWishlist, addToWishlist, removeFromWishlist,
} from '../controllers/userController';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.use(authenticate);

router.get('/me', getProfile);
router.put('/me', updateProfile);

router.get('/me/addresses', getAddresses);
router.post('/me/addresses', addAddress);
router.put('/me/addresses/:id', updateAddress);
router.delete('/me/addresses/:id', deleteAddress);

router.get('/me/wishlist', getWishlist);
router.post('/me/wishlist/:productId', addToWishlist);
router.delete('/me/wishlist/:productId', removeFromWishlist);

router.get('/me/wallet', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { User } = await import('../models/User');
    const user = await User.findById(req.user!.sub).select('walletBalance walletTransactions').lean();
    if (!user) return res.status(404).json({ error: 'NOT_FOUND', message: 'User not found' });
    res.json({ data: { balance: user.walletBalance || 0, transactions: (user.walletTransactions || []).reverse() } });
  } catch (err) { next(err); }
});

router.put('/me/preferences', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { User } = await import('../models/User');
    const { notifications, language, currency, theme } = req.body;
    const update: Record<string, unknown> = {};
    if (notifications) update['preferences.notifications'] = notifications;
    if (language) update['preferences.language'] = language;
    if (currency) update['preferences.currency'] = currency;
    if (theme) update['preferences.theme'] = theme;
    await User.findByIdAndUpdate(req.user!.sub, { $set: update });
    res.json({ success: true, message: 'Preferences updated' });
  } catch (err) { next(err); }
});

router.get('/me/notifications', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { Notification } = await import('../models/Notification');
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Notification.find({ userId: req.user!.sub }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Notification.countDocuments({ userId: req.user!.sub }),
    ]);
    res.json({ data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
});

router.put('/me/notifications/read-all', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { Notification } = await import('../models/Notification');
    await Notification.updateMany({ userId: req.user!.sub, read: false }, { $set: { read: true } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.put('/me/notifications/:id/read', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { Notification } = await import('../models/Notification');
    await Notification.findByIdAndUpdate(req.params.id, { $set: { read: true } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
