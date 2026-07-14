import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../../lib/firestore/client';

const router = Router();

router.get('/customers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.user?.uid;
    if (!vendorId) return res.status(401).json({ message: 'Unauthorized' });

    // Fetch all sub-orders for this vendor
    const ordersSnap = await db.collection('orders')
      .where(`vendors.${vendorId}`, '!=', null)
      .get();

    // Map buyer IDs to their data
    const customersMap = new Map<string, any>();

    ordersSnap.docs.forEach((doc) => {
      const data = doc.data();
      const buyerId = data.buyerId;
      const vendorData = data.vendors[vendorId];
      if (!vendorData) return;

      if (!customersMap.has(buyerId)) {
        customersMap.set(buyerId, {
          id: buyerId,
          email: data.customerEmail || 'Unknown Email',
          phone: data.shippingAddress?.phone || 'Unknown Phone',
          name: data.shippingAddress?.fullName || 'Unknown Customer',
          totalOrders: 0,
          totalSpent: 0,
          lastOrderDate: vendorData.createdAt || data.createdAt
        });
      }

      const c = customersMap.get(buyerId);
      c.totalOrders += 1;
      c.totalSpent += vendorData.total;
      if (vendorData.createdAt && c.lastOrderDate < vendorData.createdAt) {
        c.lastOrderDate = vendorData.createdAt;
      }
    });

    const customersList = Array.from(customersMap.values()).map(c => ({
      ...c,
      lastOrderDate: c.lastOrderDate?.toDate ? c.lastOrderDate.toDate() : c.lastOrderDate
    }));

    // Sort by total spent descending
    customersList.sort((a, b) => b.totalSpent - a.totalSpent);

    res.json({ data: customersList });
  } catch (err) { next(err); }
});

export default router;
