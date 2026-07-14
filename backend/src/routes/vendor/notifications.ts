import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authenticate';
import {
  listVendorNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  countUnreadNotifications,
} from '../../lib/firestore/vendor-notifications';
import { NotFoundError } from '../../utils/errors';

const router = Router();

// GET /api/vendor/notifications
router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.user!.vendorId || req.user!.sub;
    const limit = parseInt(req.query.limit as string) || 20;
    const unreadOnly = req.query.unreadOnly === 'true';
    const startAfter = req.query.startAfter as string;

    const [notifications, unreadCount] = await Promise.all([
      listVendorNotifications(vendorId, { limit, unreadOnly, startAfter }),
      countUnreadNotifications(vendorId),
    ]);

    res.json({ data: notifications, unreadCount, pagination: { limit, total: notifications.length } });
  } catch (err) { next(err); }
});

// PUT /api/vendor/notifications/:id/read
router.put('/:id/read', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await markNotificationRead(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// PUT /api/vendor/notifications/read-all
router.put('/read-all', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.user!.vendorId || req.user!.sub;
    await markAllNotificationsRead(vendorId);
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
