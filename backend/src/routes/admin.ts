import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { query } from '../config/postgres';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { Order } from '../models/Order';
import { Category } from '../models/Category';
import { releasePayment } from '../services/escrow.service';
import { emitToUser, emitToOrder } from '../server';

const router = Router();

router.use(authenticate);
router.use(authorize('platform_admin', 'super_admin'));

router.get('/dashboard', async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const [userCount, productCount, orderCount, vendorCount] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Product.countDocuments({ isActive: true }),
      Order.countDocuments({}),
      query('SELECT COUNT(*) as count FROM vendor_subscriptions WHERE status = $1', ['active']),
    ]);

    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const recentVendors = await query(
      'SELECT * FROM vendor_subscriptions ORDER BY created_at DESC LIMIT 10'
    );

    res.json({
      data: {
        stats: {
          totalUsers: userCount,
          totalProducts: productCount,
          totalOrders: orderCount,
          activeVendors: parseInt(vendorCount.rows[0]?.count || '0', 10),
        },
        recentOrders,
        recentVendors: recentVendors.rows,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/vendors', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const result = await query(
      'SELECT * FROM vendor_subscriptions ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, skip]
    );

    const countResult = await query('SELECT COUNT(*) as total FROM vendor_subscriptions', []);

    res.json({
      data: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].total, 10),
        pages: Math.ceil(parseInt(countResult.rows[0].total, 10) / limit),
      },
    });
  } catch (err) {
    next(err);
  }
});

router.put('/vendors/:id/status', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'suspended', 'cancelled'].includes(status)) {
      return res.status(422).json({ error: 'INVALID_STATUS', message: 'Invalid vendor status' });
    }

    const result = await query(
      'UPDATE vendor_subscriptions SET status = $2, updated_at = NOW() WHERE vendor_id = $1 RETURNING *',
      [id, status]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Vendor not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.get('/products/pending', async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const products = await Product.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json({ data: products });
  } catch (err) {
    next(err);
  }
});

router.put('/products/:id/featured', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isFeatured: req.body.isFeatured },
      { new: true }
    );
    if (!product) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
});

router.get('/orders', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (req.query.status) filter.status = req.query.status;

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
    const { status } = req.body;
    const update: Record<string, unknown> = {
      status,
      $push: {
        timeline: { status, timestamp: new Date(), note: `Updated by admin`, updatedBy: 'admin' },
      },
    };

    if (status === 'delivered') {
      update.deliveredAt = new Date();
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Order not found' });
    }

    if (status === 'delivered') {
      releasePayment(req.params.id).catch((err) =>
        console.error('Escrow release failed:', err.message)
      );
      emitToOrder(req.params.id, 'escrow:released', { orderId: req.params.id });
    }

    emitToOrder(req.params.id, 'order:status_changed', { orderId: req.params.id, status });
    emitToUser(order.userId, 'order:updated', { orderId: req.params.id, status });

    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
});

router.get('/activity-log', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const result = await query(
      'SELECT * FROM activity_log ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, skip]
    );

    const countResult = await query('SELECT COUNT(*) as total FROM activity_log', []);

    const mapped = result.rows.map((row: any) => ({
      id: row.id,
      action: row.action,
      entity_type: row.resource_type || '',
      entity_id: row.resource_id || '',
      performed_by: `${row.actor_type || 'system'} (${row.actor_id || 'system'})`,
      created_at: row.created_at,
      metadata: row.metadata,
    }));

    res.json({
      data: mapped,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].total, 10),
        pages: Math.ceil(parseInt(countResult.rows[0].total, 10) / limit),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── Categories ─────────────────────────────────────────────────────────────

router.get('/categories', async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const categories = await Category.find({}).sort({ name: 1 }).lean();
    res.json({ data: categories });
  } catch (err) {
    next(err);
  }
});

router.post('/categories', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { name, slug, icon, color, image, isActive } = req.body;
    if (!name || !slug) {
      return res.status(422).json({ error: 'VALIDATION_ERROR', message: 'Name and slug are required' });
    }
    const existing = await Category.findOne({ slug });
    if (existing) {
      return res.status(409).json({ error: 'DUPLICATE', message: 'Category slug already exists' });
    }
    const category = await Category.create({ name, slug, icon, color, image, isActive: isActive ?? true });
    res.status(201).json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
});

router.put('/categories/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    if (!category) return res.status(404).json({ error: 'NOT_FOUND', message: 'Category not found' });
    res.json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
});

router.delete('/categories/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ error: 'NOT_FOUND', message: 'Category not found' });
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) {
    next(err);
  }
});

// ─── Analytics ──────────────────────────────────────────────────────────────

router.get('/analytics', async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Last 7 days order + revenue trend
    const days = 7;
    const labels: string[] = [];
    const orderCounts: number[] = [];
    const revenues: number[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const start = new Date();
      start.setDate(start.getDate() - i);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);

      const [countResult, revenueResult] = await Promise.all([
        Order.countDocuments({ createdAt: { $gte: start, $lt: end } }),
        Order.aggregate([
          { $match: { createdAt: { $gte: start, $lt: end }, status: { $ne: 'cancelled' } } },
          { $group: { _id: null, total: { $sum: '$total' } } },
        ]),
      ]);

      labels.push(start.toLocaleDateString('en-IN', { weekday: 'short' }));
      orderCounts.push(countResult);
      revenues.push(revenueResult[0]?.total || 0);
    }

    // Summary totals
    const [totalRevenue, totalOrders, newUsers] = await Promise.all([
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Order.countDocuments({}),
      User.countDocuments({ createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }),
    ]);

    res.json({
      data: {
        labels,
        orderCounts,
        revenues,
        summary: {
          totalRevenue: totalRevenue[0]?.total || 0,
          totalOrders,
          newUsersLast30Days: newUsers,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── Vendor KYC/Onboarding ─────────────────────────────────────
router.get('/vendors/kyc-pending', async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { Vendor } = await import('../models/Vendor');
    const vendors = await Vendor.find({ 'kyc.kycStatus': 'submitted' }).sort({ 'kyc.kycStatus': 1 }).lean();
    res.json({ data: vendors });
  } catch (err) { next(err); }
});

router.put('/vendors/:id/kyc', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { Vendor } = await import('../models/Vendor');
    const { kycStatus, kycRejectedReason } = req.body;

    if (!['verified', 'rejected'].includes(kycStatus)) {
      return res.status(422).json({ error: 'VALIDATION_ERROR', message: 'Status must be verified or rejected' });
    }

    const vendor = await Vendor.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          'kyc.kycStatus': kycStatus,
          'kyc.kycRejectedReason': kycRejectedReason || undefined,
          kycVerified: kycStatus === 'verified',
          verified: kycStatus === 'verified',
        },
      },
      { new: true }
    );

    if (!vendor) return res.status(404).json({ error: 'NOT_FOUND', message: 'Vendor not found' });

    // Log audit
    const { logAudit } = await import('../services/audit.service');
    await logAudit({
      actorId: req.user!.sub,
      actorType: 'admin',
      action: kycStatus === 'verified' ? 'kyc.approved' : 'kyc.rejected',
      resourceType: 'vendor',
      resourceId: req.params.id,
      metadata: { reason: kycRejectedReason },
    });

    res.json({ success: true, data: vendor });
  } catch (err) { next(err); }
});

// ─── Invoice Download (admin) ──────────────────────────────────
router.get('/orders/:id/invoice', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const order = await (await import('../models/Order')).Order.findById(req.params.id).lean();
    if (!order) return res.status(404).json({ error: 'NOT_FOUND', message: 'Order not found' });

    const { generateOrderInvoice } = await import('../services/invoice.service');
    const invoice = await generateOrderInvoice(order);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${order._id}.pdf`);
    res.send(invoice);
  } catch (err) { next(err); }
});

// ─── Payout Invoice ────────────────────────────────────────────
router.get('/payouts/:id/invoice', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { generatePaymentInvoice } = await import('../services/invoice.service');
    const invoice = await generatePaymentInvoice({
      id: req.params.id,
      amount: parseFloat(req.query.amount as string) || 0,
      status: (req.query.status as string) || 'completed',
      method: (req.query.method as string) || 'bank_transfer',
      createdAt: new Date(),
      vendorName: req.query.vendorName as string,
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=payout-${req.params.id}.pdf`);
    res.send(invoice);
  } catch (err) { next(err); }
});

// ─── User Management ──────────────────────────────────────────
router.get('/users', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { User } = await import('../models/User');
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search as string;

    const filter: Record<string, unknown> = {};
    if (search) filter.$or = [{ fullName: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }, { phoneNumber: { $regex: search, $options: 'i' } }];

    const [data, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-passwordHash').lean(),
      User.countDocuments(filter),
    ]);
    res.json({ data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
});

router.put('/users/:id/status', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { User } = await import('../models/User');
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { $set: { isActive } }, { new: true }).select('-passwordHash');
    if (!user) return res.status(404).json({ error: 'NOT_FOUND', message: 'User not found' });
    const { logAudit } = await import('../services/audit.service');
    await logAudit({ actorId: req.user!.sub, actorType: 'admin', action: isActive ? 'user.activated' : 'user.suspended', resourceType: 'user', resourceId: req.params.id });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

router.post('/users/:id/wallet', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { User } = await import('../models/User');
    const { amount, type, reason } = req.body;
    if (!amount || !['credit', 'debit'].includes(type)) {
      return res.status(422).json({ error: 'VALIDATION_ERROR', message: 'Amount and type (credit/debit) required' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'NOT_FOUND', message: 'User not found' });

    const change = type === 'credit' ? amount : -amount;
    user.walletBalance = (user.walletBalance || 0) + change;
    user.walletTransactions = user.walletTransactions || [];
    user.walletTransactions.push({ amount: change, type, reason: reason || `Manual ${type} by admin`, createdAt: new Date() });
    await user.save();

    const { logAudit } = await import('../services/audit.service');
    await logAudit({ actorId: req.user!.sub, actorType: 'admin', action: `wallet.${type}`, resourceType: 'user', resourceId: req.params.id, metadata: { amount } });

    res.json({ success: true, data: { balance: user.walletBalance } });
  } catch (err) { next(err); }
});

// ─── Hero Banners ─────────────────────────────────────────────
let heroBanners: any[] = [];

router.get('/banners', async (_req: AuthenticatedRequest, res: Response) => {
  res.json({ data: heroBanners });
});

router.post('/banners', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { image, mobileImage, link, title, subtitle, active, order, startDate, endDate } = req.body;
    const banner = { id: `b${Date.now()}`, image, mobileImage: mobileImage || image, link: link || '', title: title || '', subtitle: subtitle || '', active: active !== false, order: order || 0, startDate: startDate || null, endDate: endDate || null, createdAt: new Date() };
    heroBanners.push(banner);
    res.status(201).json({ success: true, data: banner });
  } catch (err) { next(err); }
});

router.put('/banners/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const idx = heroBanners.findIndex((b: any) => b.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'NOT_FOUND', message: 'Banner not found' });
    heroBanners[idx] = { ...heroBanners[idx], ...req.body, id: req.params.id };
    res.json({ success: true, data: heroBanners[idx] });
  } catch (err) { next(err); }
});

router.delete('/banners/:id', async (req: AuthenticatedRequest, res: Response) => {
  heroBanners = heroBanners.filter((b: any) => b.id !== req.params.id);
  res.json({ success: true });
});

// ─── Reports ──────────────────────────────────────────────────
router.get('/reports/sales', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { Order } = await import('../models/Order');
    const period = req.query.period as string || 'month';
    const now = new Date();
    let startDate: Date;
    if (period === 'week') { startDate = new Date(now); startDate.setDate(startDate.getDate() - 7); }
    else if (period === 'month') { startDate = new Date(now); startDate.setMonth(startDate.getMonth() - 1); }
    else if (period === 'quarter') { startDate = new Date(now); startDate.setMonth(startDate.getMonth() - 3); }
    else if (period === 'year') { startDate = new Date(now); startDate.setFullYear(startDate.getFullYear() - 1); }
    else { startDate = new Date(now); startDate.setMonth(startDate.getMonth() - 1); }

    const orders = await Order.find({ createdAt: { $gte: startDate } }).lean();

    const dailyLabels: string[] = [];
    const dailyRevenue: number[] = [];
    const dailyOrders: number[] = [];

    const dateMap: Record<string, { revenue: number; orders: number }> = {};
    let cursor = new Date(startDate);
    while (cursor <= now) {
      const key = cursor.toISOString().slice(0, 10);
      dateMap[key] = { revenue: 0, orders: 0 };
      cursor.setDate(cursor.getDate() + 1);
    }
    orders.forEach((o: any) => {
      const key = new Date(o.createdAt).toISOString().slice(0, 10);
      if (dateMap[key]) {
        dateMap[key].orders++;
        if (o.status !== 'cancelled') dateMap[key].revenue += o.total || 0;
      }
    });
    Object.entries(dateMap).forEach(([date, data]) => {
      dailyLabels.push(new Date(date).toLocaleDateString('en-IN', { weekday: 'short' }));
      dailyRevenue.push(Math.round(data.revenue));
      dailyOrders.push(data.orders);
    });

    res.json({ data: { labels: dailyLabels, revenue: dailyRevenue, orders: dailyOrders } });
  } catch (err) { next(err); }
});

router.get('/reports/top-categories', async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { Product } = await import('../models/Product');
    const { Order } = await import('../models/Order');
    const orders = await Order.find({ status: { $ne: 'cancelled' } }).lean();

    const categoryMap: Record<string, { revenue: number; count: number }> = {};
    for (const order of orders as any[]) {
      for (const item of order.items || []) {
        const product: any = item.productSnapshot || {};
        const cat = product.category || 'Uncategorized';
        if (!categoryMap[cat]) categoryMap[cat] = { revenue: 0, count: 0 };
        categoryMap[cat].revenue += item.totalPrice || 0;
        categoryMap[cat].count += item.quantity || 1;
      }
    }

    const categories = Object.entries(categoryMap)
      .map(([name, data]) => ({ name, revenue: Math.round(data.revenue), count: data.count }))
      .sort((a, b) => b.revenue - a.revenue);

    res.json({ data: categories });
  } catch (err) { next(err); }
});

router.get('/reports/financial', async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { Order } = await import('../models/Order');
    const orders = await Order.find({}).lean();

    let gmv = 0;
    let returnsGmv = 0;
    let commission = 0;
    let pgCosts = 0;
    let totalOrders = 0;

    for (const o of orders as any[]) {
      totalOrders++;
      gmv += o.total || 0;
      if (o.status === 'returned' || o.status === 'return_requested') {
        returnsGmv += o.total || 0;
      }
      commission += (o.subtotal || 0) * 0.08; // ~8% avg commission
      pgCosts += (o.total || 0) * 0.02; // ~2% PG fee
    }

    res.json({
      data: {
        gmv: Math.round(gmv),
        returnsGmv: Math.round(returnsGmv),
        netGmv: Math.round(gmv - returnsGmv),
        commission: Math.round(commission),
        pgCosts: Math.round(pgCosts),
        netRevenue: Math.round(commission - pgCosts),
        totalOrders,
      },
    });
  } catch (err) { next(err); }
});

// ─── Brand Management ─────────────────────────────────────────
let brands: any[] = [];

router.get('/brands', async (_req: AuthenticatedRequest, res: Response) => {
  res.json({ data: brands });
});

router.post('/brands', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { name, logo, description } = req.body;
    if (!name) return res.status(422).json({ error: 'VALIDATION_ERROR', message: 'Brand name required' });
    const brand = { id: `br${Date.now()}`, name, logo: logo || '', description: description || '', approved: true, createdAt: new Date() };
    brands.push(brand);
    res.status(201).json({ success: true, data: brand });
  } catch (err) { next(err); }
});

router.put('/brands/:id', async (req: AuthenticatedRequest, res: Response) => {
  const idx = brands.findIndex((b: any) => b.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'NOT_FOUND', message: 'Brand not found' });
  brands[idx] = { ...brands[idx], ...req.body, id: req.params.id };
  res.json({ success: true, data: brands[idx] });
});

router.delete('/brands/:id', async (req: AuthenticatedRequest, res: Response) => {
  brands = brands.filter((b: any) => b.id !== req.params.id);
  res.json({ success: true });
});

export default router;
