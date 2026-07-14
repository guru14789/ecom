import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authenticate';
import { getAllOrders } from '../../lib/firestore/orders';
import { listProducts } from '../../lib/firestore/products';

const router = Router();

router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.user!.vendorId || req.user!.sub;
    const [orders, products] = await Promise.all([
      getAllOrders({ limit: 200 }),
      listProducts({ vendorId, limit: 1000 }),
    ]);

    const vendorOrders = orders.filter((o) =>
      o.vendorOrders?.some((vo) => vo.vendorId === vendorId)
    );

    const totalRevenue = vendorOrders
      .filter((o) => o.paymentStatus === 'paid')
      .reduce((sum: number, o) => sum + (o.total || 0), 0);

    const revenueByProduct: Record<string, number> = {};
    const salesCountByProduct: Record<string, number> = {};
    const dailySalesMap: Record<string, { sales: number; orders: number }> = {};

    // Initialize last 30 days
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dailySalesMap[dateStr] = { sales: 0, orders: 0 };
    }

    vendorOrders.forEach((o) => {
      // Daily Sales
      if (o.paymentStatus === 'paid' && o.createdAt) {
        let dateObj = new Date();
        if (typeof o.createdAt === 'object' && 'toDate' in o.createdAt) {
          dateObj = (o.createdAt as any).toDate();
        } else if (typeof o.createdAt === 'string') {
          dateObj = new Date(o.createdAt);
        }
        const dateStr = dateObj.toISOString().split('T')[0];
        if (dailySalesMap[dateStr]) {
          dailySalesMap[dateStr].orders += 1;
          dailySalesMap[dateStr].sales += o.total || 0;
        }
      }

      o.items?.filter((i) => i.vendorId === vendorId).forEach((i) => {
        revenueByProduct[i.productId] = (revenueByProduct[i.productId] || 0) + i.totalPrice;
        salesCountByProduct[i.productId] = (salesCountByProduct[i.productId] || 0) + i.quantity;
      });
    });

    const dailySales = Object.keys(dailySalesMap).sort().map(date => ({
      date,
      ...dailySalesMap[date],
    }));

    const topProducts = Object.entries(revenueByProduct)
      .map(([id, revenue]) => {
        const prod = products.find(p => p.id === id);
        return {
          id,
          name: prod?.name || 'Unknown Product',
          revenue,
          salesCount: salesCountByProduct[id] || 0
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    res.json({
      success: true,
      data: {
        totalOrders: vendorOrders.length,
        totalRevenue,
        totalProducts: products.length,
        dailySales,
        topProducts,
      },
    });
  } catch (err) { next(err); }
});

export default router;
