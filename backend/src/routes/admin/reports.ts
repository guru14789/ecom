import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authenticate';
import { getAllOrders } from '../../lib/firestore/orders';
import { listUsers } from '../../lib/firestore/users';

const router = Router();

router.get('/sales', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const orders = await getAllOrders({ limit: 1000 });
    const paidOrders = orders.filter((o) => o.paymentStatus === 'paid');

    const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalDiscounts = paidOrders.reduce((sum, o) => sum + (o.discount || 0) + (o.couponDiscount || 0), 0);

    res.json({
      data: {
        totalOrders: orders.length,
        paidOrders: paidOrders.length,
        totalRevenue,
        totalDiscounts,
        averageOrderValue: paidOrders.length ? totalRevenue / paidOrders.length : 0,
      }
    });
  } catch (err) { next(err); }
});

router.get('/vendors', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const users = await listUsers({ limit: 1000 });
    const vendors = users.filter((u) => u.role === 'vendor' || u.role === 'vendor_admin');
    const orders = await getAllOrders({ limit: 1000 });

    const vendorPerformance = vendors.map(v => {
      const vOrders = orders.filter(o => o.vendorOrders?.some(vo => vo.vendorId === v.vendorId));
      const revenue = vOrders.reduce((sum, o) => sum + (o.total || 0), 0);
      return {
        vendorId: v.vendorId,
        name: v.fullName,
        orders: vOrders.length,
        revenue
      };
    });

    res.json({ data: vendorPerformance });
  } catch (err) { next(err); }
});

router.get('/payouts', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const orders = await getAllOrders({ limit: 1000 });
    const pendingOrders = orders.filter((o) => o.paymentStatus === 'pending' && o.razorpayOrderId);
    const paidOrders = orders.filter((o) => o.paymentStatus === 'paid');

    res.json({
      data: {
        pendingPayoutsCount: pendingOrders.length,
        pendingPayoutsAmount: pendingOrders.reduce((sum, o) => sum + (o.total || 0), 0),
        completedPayoutsCount: paidOrders.length,
        completedPayoutsAmount: paidOrders.reduce((sum, o) => sum + (o.total || 0), 0),
      }
    });
  } catch (err) { next(err); }
});

export default router;
