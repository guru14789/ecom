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
    vendorOrders.forEach((o) => {
      o.items?.filter((i) => i.vendorId === vendorId).forEach((i) => {
        revenueByProduct[i.productId] = (revenueByProduct[i.productId] || 0) + i.totalPrice;
      });
    });

    res.json({
      data: {
        totalOrders: vendorOrders.length,
        totalRevenue,
        totalProducts: products.length,
        revenueByProduct,
      },
    });
  } catch (err) { next(err); }
});

export default router;
