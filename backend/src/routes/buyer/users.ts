import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authenticate';
import { authenticate } from '../../middleware/authenticate';
import { getUserById, updateUser } from '../../lib/firestore/users';
import { getUserNotifications, markAllRead, markRead } from '../../lib/firestore/notifications';
import { getProductById } from '../../lib/firestore/products';

const router = Router();

router.use(authenticate);

router.get('/me', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = await getUserById(req.user!.sub);
    res.json({ data: user });
  } catch (err) { next(err); }
});

router.put('/me', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { fullName, email, avatar } = req.body;
    await updateUser(req.user!.sub, { fullName, email, avatar });
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.get('/me/addresses', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = await getUserById(req.user!.sub);
    res.json({ data: user?.addresses || [] });
  } catch (err) { next(err); }
});

router.post('/me/addresses', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = await getUserById(req.user!.sub);
    const addresses = user?.addresses || [];
    const newAddress = { id: Date.now().toString(), ...req.body };
    if (req.body.isDefault) addresses.forEach((a: any) => a.isDefault = false);
    addresses.push(newAddress);
    await updateUser(req.user!.sub, { addresses });
    res.json({ success: true, data: newAddress });
  } catch (err) { next(err); }
});

router.put('/me/addresses/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = await getUserById(req.user!.sub);
    let addresses = user?.addresses || [];
    if (req.body.isDefault) addresses.forEach((a: any) => a.isDefault = false);
    addresses = addresses.map((a: any) => a.id === req.params.id || a._id === req.params.id ? { ...a, ...req.body } : a);
    await updateUser(req.user!.sub, { addresses });
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.delete('/me/addresses/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = await getUserById(req.user!.sub);
    const addresses = (user?.addresses || []).filter((a: any) => a.id !== req.params.id && a._id !== req.params.id);
    await updateUser(req.user!.sub, { addresses });
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.get('/me/wishlist', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // simplified wishlist (not in schema, skipping)
    res.json({ data: [] });
  } catch (err) { next(err); }
});

router.post('/me/wishlist/:productId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  res.json({ success: true });
});

router.delete('/me/wishlist/:productId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  res.json({ success: true });
});

router.get('/me/wallet', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = await getUserById(req.user!.sub);
    res.json({ data: { balance: user?.walletBalance || 0, transactions: (user?.walletTransactions || []).reverse() } });
  } catch (err) { next(err); }
});

router.put('/me/preferences', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = await getUserById(req.user!.sub);
    await updateUser(req.user!.sub, {
      preferences: { ...(user?.preferences || {}), ...(req.body.preferences || {}) }
    });
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.get('/me/notifications', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const data = await getUserNotifications(req.user!.sub, limit);
    res.json({ data, pagination: { limit, total: data.length, pages: 1 } });
  } catch (err) { next(err); }
});

router.put('/me/notifications/read-all', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await markAllRead(req.user!.sub);
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.put('/me/notifications/:id/read', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await markRead(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
