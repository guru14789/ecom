import { Response, NextFunction } from 'express';
import { Dispute } from '../models/Dispute';
import { AuthenticatedRequest } from '../middleware/authenticate';
import { NotFoundError, AppError } from '../utils/errors';
import { generateId } from '../utils/helpers';

export async function createDispute(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { returnRequestId, orderId, againstId, reason, detail, evidence } = req.body;
    const dispute = await Dispute.create({
      returnRequestId,
      orderId,
      raisedBy: req.user!.sub,
      raisedByRole: req.user!.role === 'vendor' || req.user!.role === 'vendor_admin' ? 'vendor' : 'buyer',
      againstId,
      reason,
      detail,
      evidence: evidence || [],
      status: 'open',
    });
    res.status(201).json({ success: true, data: dispute });
  } catch (err) {
    next(err);
  }
}

export async function getDisputes(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { status } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = {};
    if (req.user!.role === 'admin' || req.user!.role === 'super_admin') {
      if (status) filter.status = status;
    } else {
      filter.$or = [{ raisedBy: req.user!.sub }, { againstId: req.user!.sub }];
      if (status) filter.status = status;
    }
    const data = await Dispute.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function addDisputeMessage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) throw new NotFoundError('Dispute not found');

    const { message, attachments } = req.body;
    const role = req.user!.role === 'vendor' || req.user!.role === 'vendor_admin' ? 'vendor' as const
      : req.user!.role === 'admin' || req.user!.role === 'super_admin' ? 'admin' as const
      : 'buyer' as const;

    dispute.messages.push({
      _id: generateId('dmsg', 8),
      userId: req.user!.sub,
      userRole: role,
      message,
      attachments: attachments || [],
      createdAt: new Date(),
    });
    dispute.status = 'under_review';
    await dispute.save();

    res.json({ success: true, data: dispute });
  } catch (err) {
    next(err);
  }
}

export async function resolveDispute(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { resolution, status } = req.body;
    const dispute = await Dispute.findByIdAndUpdate(
      req.params.id,
      { status, resolution, resolvedBy: req.user!.sub, resolvedAt: new Date() },
      { new: true }
    );
    if (!dispute) throw new NotFoundError('Dispute not found');
    res.json({ success: true, data: dispute });
  } catch (err) {
    next(err);
  }
}
