import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest, authenticate } from '../../middleware/authenticate';
import { createRazorpayOrder, verifyRazorpaySignature } from '../../services/payment.service';
import { createOrder, getOrderById, updateOrderPayment, updateOrderStatus } from '../../lib/firestore/orders';
import { getCart, clearCart } from '../../lib/firestore/cart';
import { getProductById } from '../../lib/firestore/products';
import { getUserById } from '../../lib/firestore/users';
import { AppError, NotFoundError } from '../../utils/errors';
import { env } from '../../config/env';
import { emitToUser } from '../../server';
import { now } from '../../lib/firestore/client';
import admin from 'firebase-admin';

const router = Router();

router.use(authenticate);

router.post('/create-order', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { addressId, couponCode } = req.body;

    const user = await getUserById(req.user!.sub);
    if (!user) throw new NotFoundError('User not found');

    const address = user.addresses?.find((a: any) => a.id === addressId || a._id?.toString() === addressId);
    if (!address) throw new AppError('VALIDATION_ERROR', 'Delivery address not found', 422);

    const cart = await getCart(req.user!.sub);
    if (!cart || cart.items.length === 0) {
      throw new AppError('VALIDATION_ERROR', 'Cart is empty', 422);
    }

    const orderItems: Array<{
      productId: string;
      productSnapshot: Record<string, unknown>;
      quantity: number;
      isGroupBuy: boolean;
      unitPrice: number;
      totalPrice: number;
      variantId?: string;
      vendorId?: string;
    }> = [];
    let subtotal = 0;

    for (const cartItem of cart.items) {
      const product = await getProductById(cartItem.productId);
      if (!product) continue;

      const unitPrice = cartItem.isGroupBuy ? (product.groupPrice || product.price) : product.price;
      const totalPrice = unitPrice * cartItem.quantity;
      subtotal += totalPrice;

      orderItems.push({
        productId: product.id!,
        productSnapshot: product as unknown as Record<string, unknown>,
        quantity: cartItem.quantity,
        isGroupBuy: cartItem.isGroupBuy,
        unitPrice,
        totalPrice,
        variantId: cartItem.variantId,
        vendorId: product.vendorId,
      });
    }

    const deliveryFee = subtotal >= 500 ? 0 : subtotal >= 199 ? 15 : 25;
    const handlingFee = 5;
    const total = subtotal + handlingFee + deliveryFee;

    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const order = await createOrder({
      userId: req.user!.sub,
      items: orderItems,
      deliveryAddress: {
        houseNo: address.houseNo,
        area: address.area,
        pincode: address.pincode,
        landmark: address.landmark,
        city: address.city,
        state: address.state,
        tag: address.tag,
      },
      subtotal,
      discount: 0,
      couponDiscount: 0,
      handlingFee,
      deliveryFee,
      total,
      vendorOrders: [],
      paymentMethod: 'upi',
      paymentStatus: 'pending',
      status: 'pending',
      timeline: [{
        status: 'pending',
        timestamp: now() as admin.firestore.Timestamp,
        note: 'Order created, awaiting payment',
        updatedBy: 'system',
      }],
    });

    const razorpayOrder = await createRazorpayOrder({
      amount: Math.round(total * 100),
      currency: 'INR',
      receipt: order.id!,
      notes: {
        order_id: order.id!,
        user_id: req.user!.sub,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        orderId: order.id,
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: env.RAZORPAY_KEY_ID,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/verify', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !order_id) {
      throw new AppError('VALIDATION_ERROR', 'Missing payment verification fields', 422);
    }

    const isValid = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      throw new AppError('PAYMENT_VERIFICATION_FAILED', 'Invalid payment signature', 400);
    }

    const order = await getOrderById(order_id);
    if (!order) throw new NotFoundError('Order not found');

    if (order.userId !== req.user!.sub) {
      throw new AppError('FORBIDDEN', 'Order does not belong to user', 403);
    }

    await updateOrderPayment(order_id, {
      paymentStatus: 'paid',
      razorpayPaymentId: razorpay_payment_id,
      paidAt: now() as admin.firestore.Timestamp,
    });
    
    await updateOrderStatus(order_id, 'confirmed', `Payment verified (Razorpay: ${razorpay_payment_id})`, 'system');

    await clearCart(req.user!.sub);

    // emitToUser(req.user!.sub, 'order:created', { order: order.toObject() });

    res.json({
      success: true,
      data: {
        orderId: order.id,
        paymentStatus: 'paid',
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
