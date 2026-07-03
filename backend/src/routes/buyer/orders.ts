import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../../middleware/authenticate';
import { getOrdersByVendor, getOrderById, updateOrderStatus, createOrder } from '../../lib/firestore/orders';
import { updateProduct } from '../../lib/firestore/products';
import { createReturn } from '../../lib/firestore/returns';
import { getCart, clearCart } from '../../lib/firestore/cart';
import { now } from '../../lib/firestore/client';
import admin from 'firebase-admin';

const router = Router();

router.use(authenticate);

router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { getAllOrders } = await import('../../lib/firestore/orders');
    const limit = parseInt(req.query.limit as string) || 20;
    // We only want orders for THIS user.
    // getOrdersByVendor is for vendors, we need getOrdersByUser.
    // But getAllOrders with filter will do if there's no specific method.
    // Actually, getOrdersByUserId:
    const db = admin.firestore();
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
    const { addressId } = req.body;
    // Usually frontend uses /payments/create-order instead for Razorpay.
    // We'll leave this as a stub since Razorpay checkout handles it.
    res.status(400).json({ error: 'USE_PAYMENTS_ENDPOINT' });
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

    for (const item of order.items || []) {
      const { getProductById } = await import('../../lib/firestore/products');
      const product = await getProductById(item.productId);
      if (product) {
        await updateProduct(item.productId, { stock: (product.stock || 0) + item.quantity });
      }
    }

    await updateOrderStatus(order.id!, 'cancelled', reason, userId);

    if (order.paymentStatus === 'paid') {
      await createReturn({
        orderId: order.id!,
        userId,
        vendorId: order.items?.[0]?.vendorId || '',
        items: [{
          productId: order.items?.[0]?.productId || '',
          quantity: order.items?.reduce((s: number, i: any) => s + i.quantity, 0) || 1,
          reason: reason
        }],
        status: 'completed', // auto-refunded or pending depending on business logic
        refundAmount: order.total,
      });
    }

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

    res.json({
      success: true,
      invoice: {
        orderId: order.id,
        date: order.createdAt,
        total: order.total,
        items: order.items,
        deliveryAddress: order.deliveryAddress
      }
    });
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

    res.status(201).json({ success: true, data: returnReq });
  } catch (err) { next(err); }
});

export default router;
