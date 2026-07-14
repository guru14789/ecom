import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authenticate';
import { getVendorSubscription, SUBSCRIPTION_TIERS } from '../../services/subscription.service';
import { listProducts } from '../../lib/firestore/products';
import { getOrdersByVendor } from '../../lib/firestore/orders';
import { getPayoutsByVendor } from '../../lib/firestore/payouts';
import { getVendorById } from '../../lib/firestore/vendors';
import { countUnreadNotifications } from '../../lib/firestore/vendor-notifications';
import admin from '../../lib/firestore/client';

const router = Router();

router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.user!.vendorId || req.user!.sub;
    const db = admin.firestore();

    // ─── Parallel data fetch ───────────────────────────────────────────────────
    const [subscription, allProducts, recentOrders, payouts, vendor, unreadCount] = await Promise.all([
      getVendorSubscription(vendorId),
      listProducts({ vendorId, limit: 1000 }),
      getOrdersByVendor(vendorId, { limit: 100 }),
      getPayoutsByVendor(vendorId, 10),
      getVendorById(vendorId),
      countUnreadNotifications(vendorId),
    ]);

    // ─── Time ranges ───────────────────────────────────────────────────────────
    const now = new Date();
    const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - 7);
    const startOfMonth = new Date(now); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
    const startOfYesterday = new Date(startOfToday); startOfYesterday.setDate(startOfToday.getDate() - 1);

    // ─── Order stats ───────────────────────────────────────────────────────────
    const toTs = (ts: any): Date => ts?.toDate ? ts.toDate() : new Date(ts);

    let todayRevenue = 0, yesterdayRevenue = 0, weekRevenue = 0, monthRevenue = 0;
    let todayOrders = 0, weekOrders = 0, monthOrders = 0;
    const ordersByStatus: Record<string, number> = {};
    const revenueByProduct: Record<string, number> = {};

    recentOrders.forEach((o) => {
      const created = toTs(o.createdAt);
      const isPaid = o.paymentStatus === 'paid';
      const amount = o.total || 0;

      // Status breakdown
      ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1;

      // Revenue per product
      o.items?.filter(i => i.vendorId === vendorId).forEach(i => {
        revenueByProduct[i.productId] = (revenueByProduct[i.productId] || 0) + (isPaid ? i.totalPrice : 0);
      });

      if (created >= startOfToday) { todayOrders++; if (isPaid) todayRevenue += amount; }
      if (created >= startOfYesterday && created < startOfToday && isPaid) yesterdayRevenue += amount;
      if (created >= startOfWeek) { weekOrders++; if (isPaid) weekRevenue += amount; }
      if (created >= startOfMonth) { monthOrders++; if (isPaid) monthRevenue += amount; }
    });

    // ─── Product stats ─────────────────────────────────────────────────────────
    const totalProducts = allProducts.length;
    const activeProducts = allProducts.filter(p => p.isActive).length;
    const lowStockProducts = allProducts.filter(p => p.stock > 0 && p.stock <= (p as any).lowStockThreshold || p.stock <= 5).length;
    const outOfStockProducts = allProducts.filter(p => p.stock === 0).length;

    // ─── Top 5 products by revenue ─────────────────────────────────────────────
    const topProducts = allProducts
      .filter(p => revenueByProduct[p.id])
      .sort((a, b) => (revenueByProduct[b.id] || 0) - (revenueByProduct[a.id] || 0))
      .slice(0, 5)
      .map(p => ({ id: p.id, name: p.name, image: p.image, revenue: revenueByProduct[p.id] || 0, stock: p.stock }));

    // ─── Last 7 days chart data ────────────────────────────────────────────────
    const dailyMap: Record<string, { revenue: number; orders: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
      const key = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      dailyMap[key] = { revenue: 0, orders: 0 };
    }
    recentOrders.forEach(o => {
      const created = toTs(o.createdAt);
      const key = created.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      if (dailyMap[key]) {
        dailyMap[key].orders += 1;
        if (o.paymentStatus === 'paid') dailyMap[key].revenue += o.total || 0;
      }
    });
    const chartData = Object.entries(dailyMap).map(([date, data]) => ({ date, ...data }));

    // ─── Payout stats ──────────────────────────────────────────────────────────
    const totalEarnings = payouts.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
    const pendingPayouts = payouts.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);
    const walletBalance = vendor?.bankDetails ? (vendor as any).walletBalance || 0 : 0;

    // ─── Revenue trend (today vs yesterday) ───────────────────────────────────
    const revenueTrend = yesterdayRevenue > 0
      ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 1000) / 10
      : 0;

    res.json({
      data: {
        vendorId,
        kpis: {
          todayRevenue,
          weekRevenue,
          monthRevenue,
          revenueTrend,
          todayOrders,
          weekOrders,
          monthOrders,
          totalProducts,
          activeProducts,
          lowStockProducts,
          outOfStockProducts,
          totalEarnings,
          pendingPayouts,
          walletBalance,
          unreadNotifications: unreadCount,
        },
        ordersByStatus,
        chartData,
        topProducts,
        recentOrders: recentOrders.slice(0, 8).map(o => ({
          id: o.id,
          status: o.status,
          total: o.total,
          paymentStatus: o.paymentStatus,
          itemCount: o.items?.length || 0,
          createdAt: o.createdAt,
        })),
        subscription: subscription || { tier: 'basic', ...SUBSCRIPTION_TIERS.basic },
        recentPayouts: payouts.slice(0, 5),
      },
    });
  } catch (err) { next(err); }
});

export default router;

