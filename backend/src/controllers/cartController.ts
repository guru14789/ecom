import { Response, NextFunction } from 'express';
import { CartSession } from '../models/CartSession';
import { Product } from '../models/Product';
import { Coupon } from '../models/Coupon';
import { AuthenticatedRequest } from '../middleware/authenticate';
import { NotFoundError, AppError } from '../utils/errors';

export async function getCart(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const cart = await CartSession.findOne({ userId: req.user!.sub }).lean();
    res.json({ data: cart || { items: [], couponCode: null } });
  } catch (err) {
    next(err);
  }
}

export async function addCartItem(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { productId, quantity = 1, isGroupBuy = false, variantId } = req.body;

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      throw new NotFoundError('Product not found');
    }

    if (variantId) {
      const variant = product.variants?.find((v) => v.id === variantId);
      if (!variant || variant.stock < quantity) {
        throw new AppError('INSUFFICIENT_STOCK', 'Variant out of stock', 400);
      }
    }

    if (product.stock < quantity) {
      throw new AppError('INSUFFICIENT_STOCK', 'Product out of stock', 400);
    }

    let cart = await CartSession.findOne({ userId: req.user!.sub });
    if (!cart) {
      cart = new CartSession({ userId: req.user!.sub, items: [] });
    }

    const existingIdx = cart.items.findIndex(
      (item) => item.productId === productId && item.isGroupBuy === isGroupBuy
    );

    if (existingIdx >= 0) {
      cart.items[existingIdx].quantity += quantity;
    } else {
      cart.items.push({ productId, variantId, quantity, isGroupBuy, addedAt: new Date() });
    }

    cart.updatedAt = new Date();
    await cart.save();

    res.json({ success: true, data: cart });
  } catch (err) {
    next(err);
  }
}

export async function updateCartItem(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { productId } = req.params;
    const { quantity, isGroupBuy = false } = req.body;

    const cart = await CartSession.findOne({ userId: req.user!.sub });
    if (!cart) {
      throw new NotFoundError('Cart not found');
    }

    const item = cart.items.find(
      (item) => item.productId === productId && item.isGroupBuy === isGroupBuy
    );

    if (!item) {
      throw new NotFoundError('Item not found in cart');
    }

    if (quantity <= 0) {
      cart.items = cart.items.filter(
        (item) => !(item.productId === productId && item.isGroupBuy === isGroupBuy)
      );
    } else {
      item.quantity = quantity;
    }

    cart.updatedAt = new Date();
    await cart.save();

    res.json({ success: true, data: cart });
  } catch (err) {
    next(err);
  }
}

export async function removeCartItem(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { productId } = req.params;
    const isGroupBuy = req.query.isGroupBuy === 'true';

    const cart = await CartSession.findOne({ userId: req.user!.sub });
    if (!cart) {
      throw new NotFoundError('Cart not found');
    }

    cart.items = cart.items.filter(
      (item) => !(item.productId === productId && item.isGroupBuy === isGroupBuy)
    );

    cart.updatedAt = new Date();
    await cart.save();

    res.json({ success: true, data: cart });
  } catch (err) {
    next(err);
  }
}

export async function clearCart(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const cart = await CartSession.findOne({ userId: req.user!.sub });
    if (cart) {
      cart.items = [];
      cart.couponCode = undefined;
      cart.updatedAt = new Date();
      await cart.save();
    }

    res.json({ success: true, data: { items: [] } });
  } catch (err) {
    next(err);
  }
}

export async function applyCoupon(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { code } = req.body;

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
      validFrom: { $lte: new Date() },
      validUntil: { $gte: new Date() },
    });

    if (!coupon) {
      throw new AppError('INVALID_COUPON', 'Invalid or expired coupon code', 400);
    }

    if (coupon.currentUses >= coupon.maxUses) {
      throw new AppError('COUPON_EXHAUSTED', 'This coupon has reached its usage limit', 400);
    }

    const cart = await CartSession.findOne({ userId: req.user!.sub });
    if (cart) {
      const subtotal = await calculateCartSubtotal(cart.items);
      if (subtotal < coupon.minCartValue) {
        throw new AppError(
          'MIN_CART_NOT_MET',
          `Minimum cart value of ₹${coupon.minCartValue} required`,
          400
        );
      }

      cart.couponCode = coupon.code;
      await cart.save();
    }

    let discount = coupon.discountValue;
    if (coupon.discountType === 'percent') {
      const subtotal = cart ? await calculateCartSubtotal(cart.items) : 0;
      discount = Math.round((subtotal * coupon.discountValue) / 100);
      if (coupon.maxDiscount) {
        discount = Math.min(discount, coupon.maxDiscount);
      }
    }

    res.json({
      valid: true,
      discount,
      discountType: coupon.discountType,
      message: coupon.discountType === 'flat'
        ? `₹${discount} off applied!`
        : `${coupon.discountValue}% off applied!`,
    });
  } catch (err) {
    next(err);
  }
}

async function calculateCartSubtotal(items: Array<{ productId: string; quantity: number; isGroupBuy: boolean }>): Promise<number> {
  let subtotal = 0;
  for (const item of items) {
    const product = await Product.findById(item.productId).lean();
    if (product) {
      const price = item.isGroupBuy ? product.groupPrice : product.price;
      subtotal += price * item.quantity;
    }
  }
  return subtotal;
}
