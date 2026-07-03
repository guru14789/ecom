import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authenticate';
import { AppError, NotFoundError } from '../../utils/errors';
import { getOrdersByVendor, getOrderById, updateOrderStatus, OrderStatus } from '../../lib/firestore/orders';

const router = Router();

router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.user!.vendorId || req.user!.sub;
    const limit = parseInt(req.query.limit as string) || 20;
    const startAfter = req.query.startAfter as string;
    const status = req.query.status as string;

    const data = await getOrdersByVendor(vendorId, { limit, startAfter, status });
    res.json({ data, pagination: { limit, total: data.length } });
  } catch (err) { next(err); }
});

router.get('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.user!.vendorId || req.user!.sub;
    const order = await getOrderById(req.params.id);
    if (!order) throw new NotFoundError('Order not found');

    const hasVendorItem = order.items?.some((i) => i.vendorId === vendorId);
    if (!hasVendorItem) throw new AppError('FORBIDDEN', 'Not your order', 403);

    res.json({ data: order });
  } catch (err) { next(err); }
});

router.put('/:id/status', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.user!.vendorId || req.user!.sub;
    const { status, trackingId } = req.body;

    const order = await getOrderById(req.params.id);
    if (!order) throw new NotFoundError('Order not found');

    const hasVendorItem = order.items?.some((i) => i.vendorId === vendorId);
    if (!hasVendorItem) throw new AppError('FORBIDDEN', 'Not your order', 403);

    await updateOrderStatus(req.params.id, status as OrderStatus, 'Updated by vendor', vendorId);
    if (trackingId) {
      const { updateProduct } = await import('../../lib/firestore/products');
      // Store tracking separately if needed
    }

    res.json({ success: true, orderId: req.params.id, status });
  } catch (err) { next(err); }
});

router.get('/:id/invoice', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.user!.vendorId || req.user!.sub;
    const order = await getOrderById(req.params.id);
    if (!order) throw new NotFoundError('Order not found');

    const hasVendorItem = order.items?.some((i) => i.vendorId === vendorId);
    if (!hasVendorItem) throw new AppError('FORBIDDEN', 'Not your order', 403);

    // Return JSON summary as invoice (PDF generation removed; integrate pdfkit separately if needed)
    res.json({
      success: true,
      invoice: {
        orderId: order.id,
        total: order.total,
        items: order.items,
        deliveryAddress: order.deliveryAddress,
        createdAt: order.createdAt,
      },
    });
  } catch (err) { next(err); }
});

export default router;
