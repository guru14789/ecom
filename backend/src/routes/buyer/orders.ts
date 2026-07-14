import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../../middleware/authenticate';
import { getOrdersByVendor, getOrderById, updateOrderStatus, createOrder } from '../../lib/firestore/orders';
import { updateProduct, getProductById } from '../../lib/firestore/products';
import { createReturn } from '../../lib/firestore/returns';
import { getCart, clearCart } from '../../lib/firestore/cart';
import { db } from '../../lib/firestore/client';
import { generateInvoicePDF } from '../../services/invoice.service';
import { auditLog } from '../../services/audit.service';
import { notifyVendorOrderCancelled, notifyVendorReturnRequest } from '../../services/notification.service';

const router = Router();

router.use(authenticate);

router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const snapshot = await db.collection('orders')
      .where('userId', '==', req.user!.sub)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ data, pagination: { limit, total: data.length } });
  } catch (err) { next(err); }
});

router.get('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const order = await getOrderById(req.params.id);
    if (!order || order.userId !== req.user!.sub) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Order not found' });
    }
    res.json({ data: order });
  } catch (err) { next(err); }
});

router.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    res.json({
      success: false,
      message: 'Please use POST /api/payments/create-order to place orders via Razorpay checkout.',
      redirectTo: '/api/payments/create-order'
    });
  } catch (err) { next(err); }
});

router.post('/:id/cancel', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.sub;
    const order = await getOrderById(req.params.id);
    if (!order || order.userId !== userId) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Order not found' });
    }

    const cancellableStatuses = ['pending', 'confirmed', 'processing'];
    if (!cancellableStatuses.includes(order.status)) {
      return res.status(422).json({ error: 'INVALID_STATUS', message: `Order cannot be cancelled when status is ${order.status}` });
    }

    const reason = req.body.reason || 'Cancelled by user';

    // Restore stock for all items
    for (const item of order.items || []) {
      const product = await getProductById(item.productId);
      if (product) {
        await updateProduct(item.productId, { stock: (product.stock || 0) + item.quantity });
      }
    }

    await updateOrderStatus(order.id!, 'cancelled', reason, userId);

    // Notify each affected vendor (non-blocking)
    const notifiedVendors = new Set<string>();
    for (const vo of order.vendorOrders || []) {
      if (!notifiedVendors.has(vo.vendorId)) {
        notifyVendorOrderCancelled(vo.vendorId, order.id, reason);
        notifiedVendors.add(vo.vendorId);
      }
    }

    // Create return records if order was paid
    if (order.paymentStatus === 'paid') {
      for (const vo of order.vendorOrders || []) {
        const vendorItems = (order.items || []).filter(i => vo.items.includes(i.productId));
        if (vendorItems.length > 0) {
          await createReturn({
            orderId: order.id!,
            userId,
            vendorId: vo.vendorId,
            items: vendorItems.map(i => ({
              productId: i.productId,
              quantity: i.quantity,
              reason
            })),
            status: 'completed',
            refundAmount: vendorItems.reduce((s, i) => s + i.totalPrice, 0),
          });
        }
      }
    }

    auditLog({
      actorId: userId,
      actorType: 'buyer',
      action: 'cancel_order',
      resourceType: 'order',
      resourceId: order.id,
      metadata: { reason, status: order.status },
    });

    res.json({ success: true, message: 'Order cancelled. Refund will be processed.' });
  } catch (err) { next(err); }
});

router.get('/:id/invoice', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.sub;
    const order = await getOrderById(req.params.id);
    if (!order || order.userId !== userId) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Order not found' });
    }

    const pdfBuffer = await generateInvoicePDF(order, 'buyer');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.id}.pdf`);
    res.send(pdfBuffer);
  } catch (err) { next(err); }
});

router.post('/:id/return', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.sub;
    const order = await getOrderById(req.params.id);
    if (!order || order.userId !== userId) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Order not found' });
    }

    if (order.status !== 'delivered') {
      return res.status(422).json({ error: 'INVALID_STATUS', message: 'Only delivered orders can be returned' });
    }

    const { reason, detail, images, productId, quantity } = req.body;
    if (!reason) return res.status(422).json({ error: 'VALIDATION_ERROR', message: 'Reason is required' });

    const product = order.items?.find((i: any) => i.productId === (productId || order.items![0]?.productId));
    if (!product) return res.status(404).json({ error: 'NOT_FOUND', message: 'Product not found in order' });

    const returnReq = await createReturn({
      orderId: order.id!,
      userId,
      vendorId: product.vendorId || '',
      items: [{
        productId: product.productId,
        quantity: quantity || 1,
        reason: reason
      }],
      status: 'pending',
      refundAmount: (product as any).totalPrice || product.unitPrice * (quantity || 1),
    });

    await updateOrderStatus(order.id!, 'return_requested', `Return requested: ${reason}`, userId);

    // Notify the vendor about the return request (non-blocking)
    if (product.vendorId) {
      notifyVendorReturnRequest(product.vendorId, order.id, returnReq.id);
    }

    auditLog({
      actorId: userId,
      actorType: 'buyer',
      action: 'request_return',
      resourceType: 'order',
      resourceId: order.id,
      metadata: { returnId: returnReq.id, reason, productId: product.productId },
    });

    res.status(201).json({ success: true, data: returnReq });
  } catch (err) { next(err); }
});

export default router;
