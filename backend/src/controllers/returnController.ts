import { Response, NextFunction } from 'express';
import { ReturnRequest } from '../models/ReturnRequest';
import { Order } from '../models/Order';
import { AuthenticatedRequest } from '../middleware/authenticate';
import { NotFoundError, AppError } from '../utils/errors';

export async function getReturnRequests(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { status } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = { userId: req.user!.sub };
    if (status) filter.status = status;

    const data = await ReturnRequest.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function createReturnRequest(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { orderId, productId, quantity, reason, detail, images } = req.body;

    const order = await Order.findOne({ _id: orderId, userId: req.user!.sub });
    if (!order) throw new NotFoundError('Order not found');
    if (order.status !== 'delivered') {
      throw new AppError('INVALID_STATUS', 'Only delivered orders can be returned', 400);
    }

    const item = order.items.find((i) => i.productId === productId);
    if (!item) throw new NotFoundError('Item not found in order');

    const existing = await ReturnRequest.findOne({ orderId, productId, userId: req.user!.sub, status: { $nin: ['refunded', 'rejected'] } });
    if (existing) {
      throw new AppError('VALIDATION_ERROR', 'Return request already exists for this item', 400);
    }

    const returnReq = await ReturnRequest.create({
      orderId,
      userId: req.user!.sub,
      vendorId: item.vendorId || '',
      productId,
      quantity: quantity || item.quantity,
      reason,
      detail,
      images: images || [],
      refundAmount: item.unitPrice * (quantity || item.quantity),
      status: 'pending',
    });

    order.status = 'return_requested';
    order.timeline.push({
      status: 'return_requested',
      timestamp: new Date(),
      note: `Return requested: ${reason}`,
      updatedBy: req.user!.sub,
    });
    await order.save();

    res.status(201).json({ success: true, data: returnReq });
  } catch (err) {
    next(err);
  }
}

export async function cancelReturnRequest(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const returnReq = await ReturnRequest.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!.sub, status: { $in: ['pending', 'approved'] } },
      { status: 'refunded' as const },
      { new: true }
    );
    if (!returnReq) throw new NotFoundError('Return request not found or cannot be cancelled');
    res.json({ success: true, data: returnReq });
  } catch (err) {
    next(err);
  }
}
