import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authenticate';
import { getVendorSubscription, SUBSCRIPTION_TIERS } from '../../services/subscription.service';
import { listProducts } from '../../lib/firestore/products';
import { getAllOrders } from '../../lib/firestore/orders';
import { getPayoutsByVendor } from '../../lib/firestore/payouts';

const router = Router();

router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.user!.vendorId || req.user!.sub;

    const [subscription, products, recentOrders, payouts] = await Promise.all([
      getVendorSubscription(vendorId),
      listProducts({ vendorId, isActive: true, limit: 1000 }),
      getAllOrders({ limit: 5 }),
      getPayoutsByVendor(vendorId, 10),
    ]);

    const totalProducts = products.length;
    const vendorOrders = recentOrders.filter((o) =>
      o.vendorOrders?.some((vo) => vo.vendorId === vendorId)
    );
    const totalEarnings = payouts
      .filter((p) => p.status === 'paid')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    const pendingPayoutsTotal = payouts
      .filter((p) => p.status === 'pending')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    res.json({
      data: {
        vendorId,
        stats: {
          totalProducts,
          totalOrders: vendorOrders.length,
          totalEarnings,
          pendingPayouts: pendingPayoutsTotal,
        },
        subscription: subscription || { tier: 'basic', ...SUBSCRIPTION_TIERS.basic },
        recentOrders: vendorOrders.slice(0, 5),
        recentPayouts: payouts.slice(0, 5),
      },
    });
  } catch (err) { next(err); }
});

export default router;
