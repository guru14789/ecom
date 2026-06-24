import { Router } from 'express';
import { Response, NextFunction } from 'express-serve-static-core';
import { getOrders, getOrderById, createOrder } from '../controllers/orderController';
import { authenticate, AuthenticatedRequest } from '../middleware/authenticate';

const router = Router();

router.use(authenticate);

router.get('/', getOrders);
router.get('/:id', getOrderById);
router.post('/', createOrder);

router.post('/:id/cancel', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.sub;
    const { Order } = await import('../models/Order');
    const order = await Order.findOne({ _id: req.params.id, userId });
    if (!order) return res.status(404).json({ error: 'NOT_FOUND', message: 'Order not found' });

    const cancellableStatuses = ['pending', 'confirmed', 'processing'];
    if (!cancellableStatuses.includes(order.status)) {
      return res.status(422).json({ error: 'INVALID_STATUS', message: `Order cannot be cancelled when status is ${order.status}` });
    }

    const reason = req.body.reason || 'Cancelled by user';

    // Restore stock for each item
    const { Product } = await import('../models/Product');
    const { ReturnRequest } = await import('../models/ReturnRequest');
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } });
    }

    order.status = 'cancelled';
    order.timeline.push({ status: 'cancelled', timestamp: new Date(), note: reason, updatedBy: userId });
    await order.save();

    // Create a return request for refund tracking if paid
    if (order.paymentStatus === 'paid') {
      await ReturnRequest.create({
        orderId: order._id,
        userId,
        productId: order.items[0]?.productId || '',
        quantity: order.items.reduce((s: number, i: any) => s + i.quantity, 0),
        reason: reason,
        detail: reason,
        status: 'refunded',
        refundAmount: order.total,
        refundMethod: 'original',
      });
    }

    res.json({ success: true, data: order, message: 'Order cancelled. Refund will be processed.' });
  } catch (err) { next(err); }
});

router.get('/:id/invoice', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.sub;
    const { Order } = await import('../models/Order');
    const order = await Order.findOne({ _id: req.params.id, userId }).lean();
    if (!order) return res.status(404).json({ error: 'NOT_FOUND', message: 'Order not found' });

    const { generateOrderInvoice } = await import('../services/invoice.service');
    const invoice = await generateOrderInvoice(order);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${order._id}.pdf`);
    res.send(invoice);
  } catch (err) { next(err); }
});

router.post('/:id/return', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.sub;
    const { Order } = await import('../models/Order');
    const { ReturnRequest } = await import('../models/ReturnRequest');
    const order = await Order.findOne({ _id: req.params.id, userId });
    if (!order) return res.status(404).json({ error: 'NOT_FOUND', message: 'Order not found' });

    if (order.status !== 'delivered') {
      return res.status(422).json({ error: 'INVALID_STATUS', message: 'Only delivered orders can be returned' });
    }

    const { reason, detail, images, productId, quantity } = req.body;
    if (!reason) return res.status(422).json({ error: 'VALIDATION_ERROR', message: 'Reason is required' });

    const product = order.items.find((i: any) => i.productId === (productId || order.items[0]?.productId));
    if (!product) return res.status(404).json({ error: 'NOT_FOUND', message: 'Product not found in order' });

    const returnReq = await ReturnRequest.create({
      orderId: order._id,
      userId,
      vendorId: product.vendorId || '',
      productId: product.productId,
      quantity: quantity || 1,
      reason,
      detail: detail || '',
      images: images || [],
      status: 'pending',
      refundAmount: (product as any).totalPrice || product.unitPrice * (quantity || 1),
      refundMethod: 'original',
    });

    order.status = 'return_requested';
    order.timeline.push({ status: 'return_requested', timestamp: new Date(), note: `Return requested: ${reason}`, updatedBy: userId });
    await order.save();

    res.status(201).json({ success: true, data: returnReq });
  } catch (err) { next(err); }
});

export default router;
