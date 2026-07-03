import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authenticate';
import { getOrderById, updateOrderStatus } from '../../lib/firestore/orders';

const router = Router();

router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Return orders that are in shipping-related statuses
    const { getAllOrders } = await import('../../lib/firestore/orders');
    const orders = await getAllOrders({ status: 'shipped', limit: 50 });
    res.json({ data: orders });
  } catch (err) { next(err); }
});

router.post('/:id/track', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { trackingId } = req.body;
    const order = await getOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: 'NOT_FOUND', message: 'Order not found' });

    // In production, integrate with Delhivery API here
    res.json({ success: true, trackingId, status: 'In Transit' });
  } catch (err) { next(err); }
});

export default router;
