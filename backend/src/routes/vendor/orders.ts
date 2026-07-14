import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authenticate';
import { AppError, NotFoundError } from '../../utils/errors';
import { getOrdersByVendor, getOrderById, updateOrderStatus, OrderStatus, updateVendorOrderStatus } from '../../lib/firestore/orders';
import { generateInvoicePDF } from '../../services/invoice.service';
import { auditLog } from '../../services/audit.service';
import { notifyBuyerOrderStatus } from '../../services/notification.service';

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
    const { status, trackingId, courierName } = req.body;

    const order = await getOrderById(req.params.id);
    if (!order) throw new NotFoundError('Order not found');

    const hasVendorItem = order.items?.some((i) => i.vendorId === vendorId);
    if (!hasVendorItem) throw new AppError('FORBIDDEN', 'Not your order', 403);

    let shippingDetails;
    if (status === 'shipped' && trackingId && courierName) {
      const trackingUrl = `https://track.mockcourier.com/?awb=${trackingId}`;
      shippingDetails = { awb: trackingId, courierName, trackingUrl };

      // Send shipping email to buyer
      try {
        const { getUserById } = await import('../../lib/firestore/users');
        const { sendShippingUpdate } = await import('../../services/email');
        const buyer = await getUserById(order.userId);
        if (buyer?.email) {
          sendShippingUpdate(buyer.email, order.id, courierName, trackingId, trackingUrl);
        }
      } catch (err) {
        console.error('Failed to send shipping email:', err);
      }
    }

    await updateVendorOrderStatus(req.params.id, vendorId, status as OrderStatus, shippingDetails);

    // Notify buyer of status change (non-blocking)
    notifyBuyerOrderStatus(order.userId, order.id, status);

    // Audit log
    auditLog({
      actorId: req.user!.sub,
      actorType: 'vendor',
      action: 'update_order_status',
      resourceType: 'order',
      resourceId: req.params.id,
      metadata: { status, trackingId, courierName, vendorId },
    });

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

    const pdfBuffer = await generateInvoicePDF(order, 'vendor', vendorId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=commission-invoice-${order.id}.pdf`);
    res.send(pdfBuffer);
  } catch (err) { next(err); }
});

export default router;
