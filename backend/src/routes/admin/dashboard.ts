import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authenticate';
import { listUsers } from '../../lib/firestore/users';
import { listProducts } from '../../lib/firestore/products';
import { getAllOrders } from '../../lib/firestore/orders';

const router = Router();

router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const [users, products, orders] = await Promise.all([
      listUsers({ limit: 100 }),
      listProducts({ limit: 100 }),
      getAllOrders({ limit: 100 })
    ]);

    const totalRevenue = orders
      .filter((o) => o.paymentStatus === 'paid')
      .reduce((sum: number, o) => sum + (o.total || 0), 0);

    const vendorCount = users.filter((u) => u.role === 'vendor' || u.role === 'vendor_admin').length;

    res.json({
      data: {
        totalUsers: users.length,
        totalVendors: vendorCount,
        totalProducts: products.length,
        totalOrders: orders.length,
        totalRevenue,
      }
    });
  } catch (err) { next(err); }
});

export default router;
