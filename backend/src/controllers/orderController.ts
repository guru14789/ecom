import { Response, NextFunction } from 'express';
import { Order } from '../models/Order';
import { CartSession } from '../models/CartSession';
import { Product } from '../models/Product';
import { User } from '../models/User';
import { Vendor } from '../models/Vendor';
import { Category } from '../models/Category';
import { Coupon } from '../models/Coupon';
import { ReturnRequest } from '../models/ReturnRequest';
import { AuthenticatedRequest } from '../middleware/authenticate';
import { NotFoundError, AppError } from '../utils/errors';
import { emitToUser, emitToOrder, emitToVendor } from '../server';

export async function getOrders(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { status, page = '1', limit = '20' } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, unknown> = { userId: req.user!.sub };
    if (status && status !== 'all') {
      filter.status = status;
    }

    const [data, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      Order.countDocuments(filter),
    ]);

    res.json({
      data,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getOrderById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user!.sub,
    }).lean();

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    res.json({ data: order });
  } catch (err) {
    next(err);
  }
}

export async function createOrder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { cartId, addressId, paymentMethod, paymentReference, couponCode } = req.body;

    const user = await User.findById(req.user!.sub);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const address = user.addresses?.find((a) => a._id === addressId);
    if (!address) {
      throw new AppError('VALIDATION_ERROR', 'Delivery address not found', 422);
    }

    let cart;
    if (cartId) {
      cart = await CartSession.findById(cartId);
    } else {
      cart = await CartSession.findOne({ userId: req.user!.sub });
    }

    if (!cart || cart.items.length === 0) {
      throw new AppError('VALIDATION_ERROR', 'Cart is empty', 422);
    }

    interface OrderItemInput {
      productId: string;
      productSnapshot: Record<string, unknown>;
      quantity: number;
      isGroupBuy: boolean;
      unitPrice: number;
      totalPrice: number;
      variantId?: string;
      vendorId?: string;
    }

    const orderItems: OrderItemInput[] = [];
    let subtotal = 0;
    const vendorItemsMap = new Map<string, string[]>();

    for (const cartItem of cart.items) {
      const product = await Product.findById(cartItem.productId).lean();
      if (!product) continue;
      if (!product.isActive) {
        throw new AppError('PRODUCT_UNAVAILABLE', `"${product.name}" is currently unavailable`, 400);
      }
      if (product.stock < cartItem.quantity) {
        throw new AppError('OUT_OF_STOCK', `"${product.name}" has only ${product.stock} units in stock`, 400);
      }

      const unitPrice = cartItem.isGroupBuy ? product.groupPrice : product.price;
      const totalPrice = unitPrice * cartItem.quantity;
      subtotal += totalPrice;

      const itemId = product._id;
      orderItems.push({
        productId: itemId,
        productSnapshot: product as unknown as Record<string, unknown>,
        quantity: cartItem.quantity,
        isGroupBuy: cartItem.isGroupBuy,
        unitPrice,
        totalPrice,
        variantId: cartItem.variantId,
        vendorId: product.vendorId,
      });

      if (product.vendorId) {
        if (!vendorItemsMap.has(product.vendorId)) {
          vendorItemsMap.set(product.vendorId, []);
        }
        vendorItemsMap.get(product.vendorId)!.push(itemId);
      }

      await Product.findByIdAndUpdate(itemId, { $inc: { stock: -cartItem.quantity } });
    }

    if (orderItems.length === 0) {
      throw new AppError('VALIDATION_ERROR', 'No valid items in cart', 422);
    }

    const discount = 0;
    let couponDiscount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        isActive: true,
        validFrom: { $lte: new Date() },
        validUntil: { $gte: new Date() },
      });
      if (coupon && subtotal >= coupon.minCartValue) {
        couponDiscount = coupon.discountType === 'percent'
          ? Math.round((subtotal * coupon.discountValue) / 100)
          : coupon.discountValue;
        if (coupon.maxDiscount && couponDiscount > coupon.maxDiscount) {
          couponDiscount = coupon.maxDiscount;
        }
        await Coupon.findByIdAndUpdate(coupon._id, { $inc: { currentUses: 1 } });
      }
    }

    const deliveryFee = subtotal >= 500 ? 0 : subtotal >= 199 ? 15 : 25;
    const handlingFee = 5;
    const gstRate = 0.12;
    const gst = Math.round(subtotal * gstRate);
    const total = Math.max(0, subtotal + gst + deliveryFee + handlingFee - couponDiscount);

    const vendorOrders = Array.from(vendorItemsMap.entries()).map(([vId, itms]) => ({
      vendorId: vId,
      items: itms,
      status: 'pending',
    }));

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
      discount,
      couponDiscount,
      couponCode: couponDiscount > 0 ? couponCode : undefined,
      handlingFee,
      deliveryFee,
      total,
      paymentMethod,
      paymentReference,
      paymentStatus: paymentReference ? 'paid' : 'pending',
      status: 'pending',
      timeline: [{
        status: 'pending',
        timestamp: new Date(),
        note: 'Order created',
        updatedBy: 'system',
      }],
      vendorOrders,
    });

    await CartSession.deleteOne({ userId: req.user!.sub });
    await Vendor.updateMany(
      { _id: { $in: Array.from(vendorItemsMap.keys()) } },
      { $inc: { totalOrders: 1 } }
    );

    emitToUser(req.user!.sub, 'order:created', { order: order.toObject() });

    for (const vId of vendorItemsMap.keys()) {
      emitToVendor(vId, 'order:new', { order: order.toObject() });
    }

    res.status(201).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

export async function cancelOrder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user!.sub,
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    const cancellableStatuses = ['pending', 'confirmed', 'processing'];
    if (!cancellableStatuses.includes(order.status)) {
      throw new AppError('INVALID_STATUS', 'Order cannot be cancelled at its current status', 400);
    }

    order.status = 'cancelled';
    order.timeline.push({
      status: 'cancelled',
      timestamp: new Date(),
      note: 'Cancelled by customer',
      updatedBy: req.user!.sub,
    });
    await order.save();

    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } });
    }

    let refunded = 0;
    if (order.paymentStatus === 'paid') {
      refunded = order.total;
      const user = await User.findById(req.user!.sub);
      if (user) {
        user.walletBalance += refunded;
        user.walletTransactions.push({
          amount: refunded,
          type: 'credit',
          reason: `Refund for cancelled order ${order._id}`,
          createdAt: new Date(),
        });
        await user.save();
      }
    }

    emitToOrder(order._id, 'order:status_changed', {
      orderId: order._id, status: 'cancelled', userId: req.user!.sub,
    });
    emitToUser(req.user!.sub, 'order:cancelled', { orderId: order._id, refund: refunded });

    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

export async function returnOrder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user!.sub,
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (order.status !== 'delivered') {
      throw new AppError(
        'INVALID_STATUS',
        'Only delivered orders can be returned',
        400
      );
    }

    order.status = 'return_requested';
    order.timeline.push({
      status: 'return_requested',
      timestamp: new Date(),
      note: 'Return requested by customer',
      updatedBy: req.user!.sub,
    });
    await order.save();

    emitToOrder(order._id, 'order:status_changed', {
      orderId: order._id, status: 'return_requested', userId: req.user!.sub,
    });

    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

export async function getInvoice(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user!.sub,
    }).lean();

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    const invoice = {
      invoiceNumber: `INV-${order._id}`,
      date: order.createdAt,
      billTo: order.deliveryAddress,
      items: order.items.map((item) => ({
        name: (item.productSnapshot as { name?: string })?.name || 'Product',
        qty: item.quantity,
        unitPrice: item.unitPrice,
        total: item.totalPrice,
      })),
      subtotal: order.subtotal,
      discount: order.discount,
      deliveryFee: order.deliveryFee,
      handlingFee: order.handlingFee,
      grandTotal: order.total,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
    };

    res.json({ data: invoice });
  } catch (err) {
    next(err);
  }
}
