import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest, authenticate } from '../middleware/authenticate';
import { createRazorpayOrder, verifyRazorpaySignature } from '../services/payment.service';
import { Order } from '../models/Order';
import { CartSession } from '../models/CartSession';
import { Product } from '../models/Product';
import { User } from '../models/User';
import { AppError, NotFoundError } from '../utils/errors';
import { env } from '../config/env';
import { emitToUser } from '../server';

const router = Router();

router.use(authenticate);

router.post('/create-order', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { addressId, couponCode } = req.body;

    const user = await User.findById(req.user!.sub);
    if (!user) throw new NotFoundError('User not found');

    const address = user.addresses?.find((a) => a._id === addressId);
    if (!address) throw new AppError('VALIDATION_ERROR', 'Delivery address not found', 422);

    const cart = await CartSession.findOne({ userId: req.user!.sub });
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
      const product = await Product.findById(cartItem.productId).lean();
      if (!product) continue;

      const unitPrice = cartItem.isGroupBuy ? product.groupPrice : product.price;
      const totalPrice = unitPrice * cartItem.quantity;
      subtotal += totalPrice;

      orderItems.push({
        productId: product._id,
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

    const order = await Order.create({
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
      handlingFee,
      deliveryFee,
      total,
      paymentMethod: 'upi',
      paymentStatus: 'pending',
      status: 'pending',
      timeline: [{
        status: 'pending',
        timestamp: new Date(),
        note: 'Order created, awaiting payment',
        updatedBy: 'system',
      }],
    });

    const razorpayOrder = await createRazorpayOrder({
      amount: Math.round(total * 100),
      currency: 'INR',
      receipt: order._id,
      notes: {
        order_id: order._id,
        user_id: req.user!.sub,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        orderId: order._id,
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

    const order = await Order.findById(order_id);
    if (!order) throw new NotFoundError('Order not found');

    if (order.userId !== req.user!.sub) {
      throw new AppError('FORBIDDEN', 'Order does not belong to user', 403);
    }

    order.paymentStatus = 'paid';
    order.paymentReference = razorpay_payment_id;
    order.paidAt = new Date();
    order.status = 'confirmed';
    order.timeline.push({
      status: 'confirmed',
      timestamp: new Date(),
      note: `Payment verified (Razorpay: ${razorpay_payment_id})`,
      updatedBy: 'system',
    });
    await order.save();

    await CartSession.deleteOne({ userId: req.user!.sub });

    emitToUser(req.user!.sub, 'order:created', { order: order.toObject() });

    res.json({
      success: true,
      data: {
        orderId: order._id,
        paymentStatus: 'paid',
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
