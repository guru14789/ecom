import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authenticate';
import { getAllOrders, getOrderById, updateOrderStatus, updateOrderPayment, OrderStatus } from '../../lib/firestore/orders';
import { NotFoundError } from '../../utils/errors';
import { releasePayment, refundPayment } from '../../services/escrow.service';

const router = Router();

router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const data = await getAllOrders({ limit });
    res.json({ data, pagination: { total: data.length, limit, pages: 1 } });
  } catch (err) { next(err); }
});

router.get('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const order = await getOrderById(req.params.id);
    if (!order) throw new NotFoundError('Order not found');
    res.json({ data: order });
  } catch (err) { next(err); }
});

router.put('/:id/status', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    await updateOrderStatus(req.params.id, status as OrderStatus, 'Updated by admin', req.user!.sub);
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.put('/:id/release-payment', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const order = await getOrderById(req.params.id);
    if (!order) throw new NotFoundError('Order not found');
    
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ error: 'ALREADY_PAID', message: 'Payment is already released or paid' });
    }

    if (order.razorpayOrderId) {
       await releasePayment({
         orderId: req.params.id,
         razorpayPaymentId: order.razorpayPaymentId || `manual_${Date.now()}`
       });
    } else {
       await updateOrderPayment(req.params.id, { paymentStatus: 'paid' });
    }
    
    res.json({ success: true, message: 'Payment released to vendor' });
  } catch (err) { next(err); }
});

router.put('/:id/refund', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const order = await getOrderById(req.params.id);
    if (!order) throw new NotFoundError('Order not found');

    await refundPayment(req.params.id);
    await updateOrderStatus(req.params.id, 'cancelled', 'Refunded by admin', req.user!.sub);
    
    res.json({ success: true, message: 'Payment refunded to buyer' });
  } catch (err) { next(err); }
});

export default router;
