import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { createSubscription, getSubscription, updateSubscriptionTier, cancelSubscription, SUBSCRIPTION_TIERS } from '../services/subscription.service';
import { getVendorPendingPayouts, calculateTransactionBreakdown } from '../services/escrow.service';
import { createShipment as createLogisticsShipment, getVendorShipments } from '../services/logistics.service';
import { AppError, NotFoundError } from '../utils/errors';
import { Product } from '../models/Product';
import { Order } from '../models/Order';
import { GroupSession } from '../models/GroupSession';
import { User } from '../models/User';
import { query } from '../config/postgres';
import { emitToProduct } from '../server';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import fs from 'fs';

const router = Router();

const upload = multer({ dest: '/tmp/uploads/', limits: { fileSize: 5 * 1024 * 1024 } });

router.use(authenticate);
router.use(authorize('vendor', 'vendor_admin', 'platform_admin'));

router.get('/dashboard', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.user!.vendorId || req.user!.sub;
    const subscription = await getSubscription(vendorId);
    const pendingPayouts = await getVendorPendingPayouts(vendorId);
    const totalPending = pendingPayouts.reduce((sum, p) => sum + ((p as { amount: number }).amount || 0), 0);

    const [totalProducts, totalOrders] = await Promise.all([
      Product.countDocuments({ vendorId, isActive: true }),
      Order.countDocuments({ 'items.vendorId': vendorId }),
    ]);

    const recentOrders = await Order.find({ 'items.vendorId': vendorId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const totalEarningsResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM escrow_transactions WHERE vendor_id = $1 AND status IN ('released', 'paid')`,
      [vendorId]
    );
    const totalEarnings = parseFloat(totalEarningsResult.rows[0]?.total || '0');

    res.json({
      data: {
        vendorId,
        stats: { totalProducts, totalOrders, totalEarnings, pendingPayouts: totalPending },
        subscription,
        recentOrders,
        recentTransactions: pendingPayouts.slice(0, 5),
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/subscription', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.user!.vendorId || req.user!.sub;
    const subscription = await getSubscription(vendorId);
    res.json({ data: { subscription, tiers: SUBSCRIPTION_TIERS } });
  } catch (err) {
    next(err);
  }
});

router.post('/subscription', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.user!.vendorId || req.user!.sub;
    const { tier } = req.body;

    if (!tier || !SUBSCRIPTION_TIERS[tier]) {
      throw new AppError('VALIDATION_ERROR', 'Invalid subscription tier', 422);
    }

    const subscription = await updateSubscriptionTier(vendorId, tier);
    res.json({ success: true, data: subscription });
  } catch (err) {
    next(err);
  }
});

router.post('/subscription/cancel', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.user!.vendorId || req.user!.sub;
    await cancelSubscription(vendorId);
    res.json({ success: true, message: 'Subscription cancelled' });
  } catch (err) {
    next(err);
  }
});

router.get('/payouts', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.user!.vendorId || req.user!.sub;
    const payouts = await getVendorPendingPayouts(vendorId);
    res.json({ data: payouts });
  } catch (err) {
    next(err);
  }
});

router.get('/shipments', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.user!.vendorId || req.user!.sub;
    const shipments = await getVendorShipments(vendorId);
    res.json({ data: shipments });
  } catch (err) {
    next(err);
  }
});

router.post('/shipments', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.user!.vendorId || req.user!.sub;
    const shipment = await createLogisticsShipment({ vendorId, ...req.body });
    res.status(201).json({ success: true, data: shipment });
  } catch (err) {
    next(err);
  }
});

router.get('/products', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.user!.vendorId || req.user!.sub;
    const products = await Product.find({ vendorId }).sort({ createdAt: -1 }).lean();
    res.json({ data: products });
  } catch (err) {
    next(err);
  }
});

router.post('/products', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.user!.vendorId || req.user!.sub;
    const { name, description, category, subcategory, brand, tags, price, groupPrice, mrp, stock, image, images, specs, highlights, variants, returnPolicy, warranty, deliveryTime, badge } = req.body;
    if (!name || !price || !category) {
      throw new AppError('VALIDATION_ERROR', 'Name, price, and category are required', 422);
    }
    const product = await Product.create({
      name,
      description: description || '',
      slug: name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
      category,
      subcategory: subcategory || undefined,
      brand: brand || undefined,
      tags: tags || [],
      price,
      groupPrice: groupPrice || price,
      mrp: mrp || undefined,
      stock: stock || 0,
      image: image || 'https://via.placeholder.com/400',
      images: images || [],
      specs: specs || [],
      highlights: highlights || [],
      variants: variants || [],
      returnPolicy: returnPolicy || undefined,
      warranty: warranty || undefined,
      deliveryTime: deliveryTime || undefined,
      badge: badge || undefined,
      vendorId,
      targetCount: 5,
      isActive: true,
    });
    res.status(201).json({ success: true, data: product });
  } catch (err) { next(err); }
});

router.post('/products/bulk-stock', upload.single('file'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.user!.vendorId || req.user!.sub;
    if (!req.file) throw new AppError('VALIDATION_ERROR', 'CSV file required', 422);

    const content = fs.readFileSync(req.file.path, 'utf-8');
    const records = parse(content, { columns: true, skip_empty_lines: true, trim: true });

    if (records.length === 0) throw new AppError('VALIDATION_ERROR', 'CSV file is empty', 422);
    if (records.length > 1000) throw new AppError('VALIDATION_ERROR', 'Maximum 1000 records per upload', 422);

    const results = { updated: 0, failed: 0, errors: [] as string[] };

    for (const rawRow of records) {
      const row = rawRow as Record<string, string>;
      try {
        const productId = row.product_id || row.id || row._id;
        if (!productId) { results.failed++; results.errors.push(`Row missing product_id`); continue; }

        const update: Record<string, unknown> = {};
        if (row.stock !== undefined) update.stock = parseInt(row.stock) || 0;
        if (row.price !== undefined) update.price = parseFloat(row.price);
        if (row.groupPrice !== undefined) update.groupPrice = parseFloat(row.groupPrice);
        if (row.isActive !== undefined) update.isActive = row.isActive.toLowerCase() === 'true';

        if (Object.keys(update).length === 0) { results.failed++; results.errors.push(`Product ${productId}: no valid fields`); continue; }

        const product = await Product.findOneAndUpdate(
          { _id: productId, vendorId },
          { $set: update },
          { new: true }
        );

        if (!product) { results.failed++; results.errors.push(`Product ${productId}: not found`); continue; }

        results.updated++;
      } catch (err: any) {
        results.failed++;
        results.errors.push(err.message || 'Unknown error');
      }
    }

    fs.unlink(req.file.path, () => {});

    res.json({ success: true, data: results });
  } catch (err) { next(err); }
});

router.get('/kyc-status', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.user!.vendorId || req.user!.sub;
    const { Vendor } = await import('../models/Vendor');
    let vendor = await Vendor.findById(vendorId).lean();
    if (!vendor) {
      vendor = await Vendor.findByIdAndUpdate(
        vendorId,
        { $setOnInsert: { _id: vendorId, name: '', ownerName: '', email: '', phoneNumber: '', storeName: '' } },
        { upsert: true, new: true }
      ).lean();
    }
    res.json({ data: { kyc: vendor.kyc, bank: vendor.bank, gstin: vendor.gstin, pan: vendor.pan, businessType: vendor.businessType, kycVerified: vendor.kycVerified, verified: vendor.verified } });
  } catch (err) { next(err); }
});

router.put('/kyc', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.user!.vendorId || req.user!.sub;
    const { Vendor } = await import('../models/Vendor');
    const { businessType, pan, gstin, bank, documents } = req.body;

    const update: Record<string, unknown> = {};
    if (businessType) update['kyc.businessType'] = businessType;
    if (pan) update['kyc.pan'] = pan;
    if (gstin) update.gstin = gstin;
    if (bank) update.bank = bank;
    if (documents) update['kyc.documents'] = documents;
    update['kyc.kycStatus'] = 'submitted';

    const vendor = await Vendor.findByIdAndUpdate(
      vendorId,
      { $set: update },
      { upsert: true, new: true }
    );
    res.json({ success: true, message: 'KYC submitted for review', data: { kycStatus: vendor!.kyc.kycStatus } });
  } catch (err) { next(err); }
});

router.put('/products/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.user!.vendorId || req.user!.sub;
    const updates = req.body;
    delete updates._id;
    delete updates.vendorId;
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, vendorId },
      { $set: updates },
      { new: true }
    );
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    emitToProduct(req.params.id, 'product:updated', {
      type: 'price_change',
      productId: product._id,
      price: product.price,
      stock: product.stock,
      isActive: product.isActive,
    });

    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
});

router.delete('/products/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.user!.vendorId || req.user!.sub;
    const product = await Product.findOneAndDelete({ _id: req.params.id, vendorId });
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    emitToProduct(req.params.id, 'product:updated', {
      type: 'deleted',
      productId: req.params.id,
    });

    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    next(err);
  }
});

router.get('/orders', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.user!.vendorId || req.user!.sub;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status as string;

    const filter: Record<string, unknown> = { 'items.vendorId': vendorId };
    if (status) filter.status = status;

    const [data, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Order.countDocuments(filter),
    ]);

    res.json({
      data,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

router.put('/orders/:id/status', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.user!.vendorId || req.user!.sub;
    const { status } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) throw new NotFoundError('Order not found');

    const hasVendorItem = order.items.some((i) => i.vendorId === vendorId);
    if (!hasVendorItem) throw new AppError('FORBIDDEN', 'Not your order', 403);

    order.status = status;
    order.timeline.push({ status, timestamp: new Date(), note: `Updated by vendor`, updatedBy: vendorId });
    if (status === 'shipped' && req.body.trackingId) {
      order.trackingId = req.body.trackingId;
    }
    if (status === 'delivered') order.deliveredAt = new Date();
    await order.save();

    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
});

router.get('/settings', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.sub;
    const user = await User.findById(userId).lean();
    if (!user) throw new NotFoundError('User not found');
    const postgresData = await query('SELECT * FROM vendor_subscriptions WHERE vendor_id = $1', [req.user!.vendorId || userId]);
    res.json({
      data: {
        storeName: (postgresData.rows[0] as any)?.business_name || '',
        ownerName: user.fullName || '',
        email: user.email || '',
        phone: user.phoneNumber || '',
        gstin: (postgresData.rows[0] as any)?.gstin || '',
        address: '',
      },
    });
  } catch (err) {
    next(err);
  }
});

router.put('/settings', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.sub;
    const vendorId = req.user!.vendorId || userId;
    const { storeName, ownerName, email, phone, gstin } = req.body;

    await User.findByIdAndUpdate(userId, { fullName: ownerName, email, phoneNumber: phone });

    await query(
      `INSERT INTO vendor_subscriptions (vendor_id, business_name, gstin, status, created_at)
       VALUES ($1, $2, $3, 'active', NOW())
       ON CONFLICT (vendor_id) DO UPDATE SET business_name = $2, gstin = $3, updated_at = NOW()`,
      [vendorId, storeName, gstin]
    );

    res.json({ success: true, message: 'Settings saved' });
  } catch (err) {
    next(err);
  }
});

router.get('/groups', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.user!.vendorId || req.user!.sub;
    const vendorProducts = await Product.find({ vendorId }).select('_id').lean();
    const productIds = vendorProducts.map((p) => p._id);

    const groups = await GroupSession.find({ productId: { $in: productIds } })
      .sort({ startedAt: -1 })
      .limit(50)
      .lean();

    res.json({ data: groups });
  } catch (err) {
    next(err);
  }
});

router.post('/groups', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.user!.vendorId || req.user!.sub;
    const { productId, groupPrice, targetCount, durationHours = 48 } = req.body;

    const product = await Product.findOne({ _id: productId, vendorId });
    if (!product) {
      throw new NotFoundError('Product not found or not owned by you');
    }

    const existing = await GroupSession.findOne({ productId, status: 'active' });
    if (existing) {
      throw new AppError('SESSION_EXISTS', 'An active group session already exists for this product', 409);
    }

    const activeCount = await GroupSession.countDocuments({ hostUserId: vendorId, status: 'active' });
    if (activeCount >= 10) {
      throw new AppError('LIMIT_EXCEEDED', 'Maximum 10 active group sessions', 400);
    }

    const maxDuration = Math.min(Math.max(durationHours, 2), 168);
    const endsAt = new Date(Date.now() + maxDuration * 60 * 60 * 1000);

    if (groupPrice !== undefined) {
      product.groupPrice = groupPrice;
    }
    if (targetCount !== undefined) {
      product.targetCount = targetCount;
    }
    await product.save();

    const session = await GroupSession.create({
      productId,
      hostUserId: vendorId,
      targetCount: targetCount || product.targetCount,
      currentCount: 0,
      status: 'active',
      startedAt: new Date(),
      endsAt,
    });

    res.status(201).json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
});

router.post('/groups/:id/cancel', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const session = await GroupSession.findById(req.params.id);
    if (!session) {
      throw new NotFoundError('Group session not found');
    }
    session.status = 'cancelled';
    await session.save();
    res.json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
});

router.get('/breakdown', (req: AuthenticatedRequest, res: Response) => {
  const amount = parseFloat(req.query.amount as string) || 0;
  const breakdown = calculateTransactionBreakdown(amount);
  res.json({ data: breakdown });
});

// ─── Vendor Coupons ───────────────────────────────────────────
router.get('/coupons', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.user!.vendorId || req.user!.sub;
    const { Coupon } = await import('../models/Coupon');
    const data = await Coupon.find({ vendorId, type: 'vendor' }).sort({ createdAt: -1 }).lean();
    res.json({ data });
  } catch (err) { next(err); }
});

router.post('/coupons', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.user!.vendorId || req.user!.sub;
    const { Coupon } = await import('../models/Coupon');
    const coupon = await Coupon.create({ ...req.body, vendorId, type: 'vendor', createdBy: req.user!.sub });
    res.status(201).json({ success: true, data: coupon });
  } catch (err) { next(err); }
});

router.delete('/coupons/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { Coupon } = await import('../models/Coupon');
    await Coupon.findOneAndDelete({ _id: req.params.id, vendorId: req.user!.vendorId || req.user!.sub });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ─── Vendor Returns ──────────────────────────────────────────
router.get('/returns', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.user!.vendorId || req.user!.sub;
    const { ReturnRequest } = await import('../models/ReturnRequest');
    const { status } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = { vendorId };
    if (status) filter.status = status;
    const data = await ReturnRequest.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ data });
  } catch (err) { next(err); }
});

router.patch('/returns/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.user!.vendorId || req.user!.sub;
    const { ReturnRequest } = await import('../models/ReturnRequest');
    const { status, vendorNote } = req.body;
    const returnReq = await ReturnRequest.findOneAndUpdate(
      { _id: req.params.id, vendorId },
      { status, vendorNote },
      { new: true }
    );
    if (!returnReq) throw new NotFoundError('Return request not found');
    res.json({ success: true, data: returnReq });
  } catch (err) { next(err); }
});

router.post('/returns/:id/refund', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.user!.vendorId || req.user!.sub;
    const { ReturnRequest } = await import('../models/ReturnRequest');
    const { Order } = await import('../models/Order');
    const returnReq = await ReturnRequest.findOne({ _id: req.params.id, vendorId });
    if (!returnReq) throw new NotFoundError('Return request not found');

    returnReq.status = 'refunded';
    returnReq.refundedAt = new Date();
    returnReq.refundReference = req.body.refundReference;
    await returnReq.save();

    const order = await Order.findById(returnReq.orderId);
    if (order) {
      order.status = 'returned';
      order.timeline.push({
        status: 'returned',
        timestamp: new Date(),
        note: 'Refund processed',
        updatedBy: req.user!.sub,
      });
      await order.save();
    }

    res.json({ success: true, data: returnReq });
  } catch (err) { next(err); }
});

// ─── Vendor Analytics ─────────────────────────────────────────
router.get('/analytics', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.user!.vendorId || req.user!.sub;
    const { period = 'week' } = req.query as Record<string, string>;

    const now = new Date();
    let startDate: Date;
    if (period === 'week') { startDate = new Date(now); startDate.setDate(startDate.getDate() - 7); }
    else if (period === 'month') { startDate = new Date(now); startDate.setMonth(startDate.getMonth() - 1); }
    else if (period === 'year') { startDate = new Date(now); startDate.setFullYear(startDate.getFullYear() - 1); }
    else { startDate = new Date(now); startDate.setDate(startDate.getDate() - 7); }

    const orders = await Order.find({ 'items.vendorId': vendorId, createdAt: { $gte: startDate } }).lean();

    const totalSales = orders.filter((o) => o.status !== 'cancelled').length;
    const totalRevenue = orders.filter((o) => o.status !== 'cancelled' && o.paymentStatus === 'paid')
      .reduce((s, o) => s + o.total, 0);
    const cancelled = orders.filter((o) => o.status === 'cancelled').length;
    const returned = orders.filter((o) => o.status === 'returned' || o.status === 'return_requested').length;

    const dailySales: Record<string, number> = {};
    orders.forEach((o) => {
      const day = new Date(o.createdAt).toISOString().slice(0, 10);
      if (o.status !== 'cancelled') dailySales[day] = (dailySales[day] || 0) + 1;
    });

    const topProducts = await Product.find({ vendorId }).sort({ reviews: -1 }).limit(5).lean();

    res.json({
      data: {
        period,
        totalSales,
        totalRevenue,
        cancelledOrders: cancelled,
        returnedOrders: returned,
        returnRate: totalSales > 0 ? Math.round((returned / totalSales) * 100) : 0,
        dailySales,
        topProducts: topProducts.map((p) => ({ id: p._id, name: p.name, sales: p.reviews, revenue: p.reviews * p.price })),
        conversionRate: 0,
        averageOrderValue: totalSales > 0 ? Math.round(totalRevenue / totalSales) : 0,
      },
    });
  } catch (err) { next(err); }
});

router.get('/payouts/:id/invoice', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { generatePaymentInvoice } = await import('../services/invoice.service');
    const { Vendor } = await import('../models/Vendor');
    const vendor = await Vendor.findOne({ userId: req.user!.sub }).lean();
    const vendorName = (vendor as any)?.storeName || (vendor as any)?.businessName || req.user!.sub;
    const invoice = await generatePaymentInvoice({
      id: req.params.id,
      amount: parseFloat(req.query.amount as string) || 0,
      status: (req.query.status as string) || 'completed',
      method: (req.query.method as string) || 'bank_transfer',
      createdAt: new Date(),
      vendorName,
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=payout-${req.params.id}.pdf`);
    res.send(invoice);
  } catch (err) { next(err); }
});

router.get('/orders/:id/invoice', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.user!.vendorId || req.user!.sub;
    const order = await Order.findById(req.params.id).lean();
    if (!order) throw new NotFoundError('Order not found');

    const hasVendorItem = order.items.some((i: any) => i.vendorId === vendorId);
    if (!hasVendorItem) throw new AppError('FORBIDDEN', 'Not your order', 403);

    const invoice = await (await import('../services/invoice.service')).generateOrderInvoice(order);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${order._id}.pdf`);
    res.send(invoice);
  } catch (err) { next(err); }
});

export default router;
