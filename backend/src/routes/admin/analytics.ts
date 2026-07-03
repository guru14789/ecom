import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authenticate';
import { getAllOrders } from '../../lib/firestore/orders';
import { listUsers } from '../../lib/firestore/users';

const router = Router();

router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const period = req.query.period as string || '30d'; // simplifed
    
    const [orders, users] = await Promise.all([
      getAllOrders({ limit: 1000 }),
      listUsers({ limit: 1000 })
    ]);

    const totalRevenue = orders
      .filter((o) => o.paymentStatus === 'paid')
      .reduce((sum: number, o) => sum + (o.total || 0), 0);

    const activeUsers = users.filter(u => u.isActive).length;

    res.json({
      data: {
        totalRevenue,
        ordersCount: orders.length,
        activeUsers,
        period
      }
    });
  } catch (err) { next(err); }
});

export default router;
