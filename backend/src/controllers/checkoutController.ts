import { Response, NextFunction } from 'express';
import { Product } from '../models/Product';
import { Coupon } from '../models/Coupon';
import { AuthenticatedRequest } from '../middleware/authenticate';
import { AppError } from '../utils/errors';
import { checkPincodeServiceability as logisticsPincodeCheck, estimateTat } from '../services/logistics.service';

interface DeliveryOption {
  type: 'standard' | 'express';
  label: string;
  charge: number;
  estimatedDays: string;
  estimatedDate: string;
}

export async function getDeliveryEstimate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { pincode, productId } = req.query as Record<string, string>;
    if (!pincode) throw new AppError('VALIDATION_ERROR', 'Pincode is required', 422);

    const product = productId ? await Product.findById(productId).lean() : null;

    let serviceable = true;
    let courierOptions: any[] = [];
    try {
      const result: any = await logisticsPincodeCheck(pincode);
      if (result) {
        serviceable = result.serviceable !== false;
        courierOptions = result.couriers || [];
      }
    } catch {
      serviceable = true;
    }

    const now = new Date();
    const addDays = (days: number) => {
      const d = new Date(now);
      d.setDate(d.getDate() + days);
      return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    };

    const options: DeliveryOption[] = [];
    if (serviceable) {
      options.push({
        type: 'standard',
        label: 'Standard Delivery',
        charge: 0,
        estimatedDays: '3-5 business days',
        estimatedDate: `${addDays(3)} - ${addDays(5)}`,
      });
      options.push({
        type: 'express',
        label: 'Express Delivery',
        charge: 49,
        estimatedDays: '1-2 business days',
        estimatedDate: `${addDays(1)} - ${addDays(2)}`,
      });
    }

    res.json({
      data: {
        pincode,
        serviceable,
        options,
        courierOptions,
        productDeliveryTime: product?.deliveryTime || undefined,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function checkPincodeServiceability(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { pincode } = req.query as Record<string, string>;
    if (!pincode) throw new AppError('VALIDATION_ERROR', 'Pincode is required', 422);

    let serviceable = true;
    let couriers: any[] = [];
    try {
      const result: any = await logisticsPincodeCheck(pincode);
      if (result) {
        serviceable = result.serviceable !== false;
        couriers = result.couriers || [];
      }
    } catch {
      // default serviceable
    }

    let tat: any = null;
    try {
      tat = await estimateTat({ originPincode: '110001', destinationPincode: pincode });
    } catch { /* ignore */ }

    res.json({ data: { pincode, serviceable, couriers, tat } });
  } catch (err) {
    next(err);
  }
}

export async function validateCoupon(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { code, cartValue, items } = req.body;
    if (!code) throw new AppError('VALIDATION_ERROR', 'Coupon code is required', 422);

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
      validFrom: { $lte: new Date() },
      validUntil: { $gte: new Date() },
    });

    if (!coupon) {
      return res.json({ valid: false, error: 'Invalid or expired coupon code' });
    }

    if (coupon.currentUses >= coupon.maxUses) {
      return res.json({ valid: false, error: 'Coupon usage limit reached' });
    }

    if (cartValue < coupon.minCartValue) {
      return res.json({ valid: false, error: `Minimum cart value of ₹${coupon.minCartValue.toLocaleString('en-IN')} required` });
    }

    let discount = coupon.discountType === 'percent'
      ? Math.round((cartValue * coupon.discountValue) / 100)
      : coupon.discountValue;

    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }

    if (discount > cartValue) discount = cartValue;

    res.json({
      valid: true,
      data: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discount,
        description: coupon.description,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getCheckoutSummary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { items, pincode, couponCode } = req.body;

    if (!items?.length) {
      throw new AppError('VALIDATION_ERROR', 'Cart items are required', 422);
    }

    const productIds = items.map((i: any) => i.productId);
    const products = await Product.find({ _id: { $in: productIds } }).lean();
    const productMap = new Map(products.map((p) => [p._id, p]));

    let subtotal = 0;
    const lineItems = items.map((item: any) => {
      const product = productMap.get(item.productId);
      if (!product) return null;
      const price = item.isGroupBuy ? product.groupPrice : product.price;
      const total = price * item.quantity;
      subtotal += total;
      return {
        productId: product._id,
        name: product.name,
        image: product.image,
        price,
        quantity: item.quantity,
        total,
        vendorId: product.vendorId,
      };
    }).filter(Boolean);

    const deliveryFee = subtotal >= 500 ? 0 : subtotal >= 199 ? 15 : 25;
    const handlingFee = 5;
    let couponDiscount = 0;
    let gst = Math.round(subtotal * 0.12);
    let total = subtotal + deliveryFee + handlingFee + gst - couponDiscount;

    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        isActive: true,
        validFrom: { $lte: new Date() },
        validUntil: { $gte: new Date() },
      });
      if (coupon) {
        if (subtotal >= coupon.minCartValue) {
          couponDiscount = coupon.discountType === 'percent'
            ? Math.round((subtotal * coupon.discountValue) / 100)
            : coupon.discountValue;
          if (coupon.maxDiscount && couponDiscount > coupon.maxDiscount) {
            couponDiscount = coupon.maxDiscount;
          }
        }
        total = subtotal + deliveryFee + handlingFee + gst - couponDiscount;
      }
    }

    res.json({
      data: {
        items: lineItems,
        subtotal,
        gst,
        deliveryFee,
        handlingFee,
        couponDiscount,
        couponCode: couponDiscount > 0 ? couponCode : undefined,
        total: Math.max(0, total),
        breakdown: {
          itemTotal: subtotal,
          gstRate: '12%',
          deliveryCharge: deliveryFee,
          handlingCharge: handlingFee,
          platformFee: 0,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function checkCodAvailability(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { pincode, amount } = req.query as Record<string, string>;
    const codEnabled = true;
    const codCharge = 0;
    const maxCodAmount = 50000;
    const available = codEnabled && (!amount || parseInt(amount, 10) <= maxCodAmount);

    res.json({ data: { available, charge: codCharge, maxAmount: maxCodAmount } });
  } catch (err) {
    next(err);
  }
}
