import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authenticate';
import { getAllOrders, getOrderById, updateOrderStatus, updateOrderPayment, OrderStatus } from '../../lib/firestore/orders';
import { NotFoundError } from '../../utils/errors';
import { releasePayment, refundPayment } from '../../services/escrow.service';
import { auditLog } from '../../services/audit.service';
import { notifyBuyerRefundProcessed, notifyVendorPaymentReleased } from '../../services/notification.service';
import { getVendorById } from '../../lib/firestore/vendors';

const router = Router();

router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const status = req.query.status as string;
    const paymentStatus = req.query.paymentStatus as string;
    const data = await getAllOrders({ limit, status, paymentStatus });
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

    auditLog({
      actorId: req.user!.sub,
      actorType: 'admin',
      action: 'update_order_status',
      resourceType: 'order',
      resourceId: req.params.id,
      metadata: { status },
    });

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

    // Notify each vendor whose order was just paid out (non-blocking)
    for (const vo of order.vendorOrders || []) {
      const vendorItems = order.items.filter(i => i.vendorId === vo.vendorId);
      const vendorTotal = vendorItems.reduce((s, i) => s + i.totalPrice, 0);
      notifyVendorPaymentReleased(vo.vendorId, order.id, vendorTotal);
    }

    auditLog({
      actorId: req.user!.sub,
      actorType: 'admin',
      action: 'release_payment',
      resourceType: 'order',
      resourceId: req.params.id,
      metadata: { total: order.total, paymentMethod: order.paymentMethod },
    });

    res.json({ success: true, message: 'Payment released to vendor' });
  } catch (err) { next(err); }
});

router.put('/:id/refund', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const order = await getOrderById(req.params.id);
    if (!order) throw new NotFoundError('Order not found');

    await refundPayment(req.params.id);
    await updateOrderStatus(req.params.id, 'cancelled', 'Refunded by admin', req.user!.sub);

    // Notify buyer of refund (non-blocking)
    notifyBuyerRefundProcessed(order.userId, order.id, order.total);

    auditLog({
      actorId: req.user!.sub,
      actorType: 'admin',
      action: 'refund_order',
      resourceType: 'order',
      resourceId: req.params.id,
      metadata: { total: order.total, userId: order.userId },
    });

    res.json({ success: true, message: 'Payment refunded to buyer' });
  } catch (err) { next(err); }
});

export default router;
