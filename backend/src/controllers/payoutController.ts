import { Response, NextFunction } from 'express';
import { Payout } from '../models/Payout';
import { AuthenticatedRequest } from '../middleware/authenticate';
import { NotFoundError } from '../utils/errors';

export async function getPayouts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const vendorId = req.user!.vendorId;
    const { status, page = '1', limit = '20' } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, unknown> = { vendorId };
    if (status) filter.status = status;

    const [data, total] = await Promise.all([
      Payout.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      Payout.countDocuments(filter),
    ]);

    res.json({
      data,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    next(err);
  }
}

export async function getPayoutById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const payout = await Payout.findOne({ _id: req.params.id, vendorId: req.user!.vendorId }).lean();
    if (!payout) throw new NotFoundError('Payout not found');
    res.json({ data: payout });
  } catch (err) {
    next(err);
  }
}

export async function getAllPayouts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { status, vendorId, page = '1', limit = '50' } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (vendorId) filter.vendorId = vendorId;

    const [data, total] = await Promise.all([
      Payout.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      Payout.countDocuments(filter),
    ]);

    res.json({
      data,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    next(err);
  }
}

export async function generatePayoutBatch(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { vendorId, periodStart, periodEnd, orders } = req.body;
    const gross = orders.reduce((s: number, o: any) => s + o.amount, 0);
    const commission = orders.reduce((s: number, o: any) => s + (o.commission || 0), 0);
    const pgFees = orders.reduce((s: number, o: any) => s + (o.pgFee || 0), 0);
    const shippingFees = orders.reduce((s: number, o: any) => s + (o.shippingFee || 0), 0);
    const tds = Math.round(gross * 0.01);
    const returns = orders.reduce((s: number, o: any) => s + (o.returnAmount || 0), 0);
    const net = gross - commission - pgFees - shippingFees - tds - returns;

    const payout = await Payout.create({
      vendorId,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      items: orders,
      grossAmount: gross,
      totalCommission: commission,
      totalPgFee: pgFees,
      totalShippingFee: shippingFees,
      totalReturns: returns,
      totalTds: tds,
      netAmount: Math.max(0, net),
      status: 'pending',
    });

    res.status(201).json({ success: true, data: payout });
  } catch (err) {
    next(err);
  }
}

export async function markPayoutPaid(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { paymentReference } = req.body;
    const payout = await Payout.findByIdAndUpdate(
      req.params.id,
      { status: 'paid', paymentReference, paidAt: new Date() },
      { new: true }
    );
    if (!payout) throw new NotFoundError('Payout not found');
    res.json({ success: true, data: payout });
  } catch (err) {
    next(err);
  }
}
