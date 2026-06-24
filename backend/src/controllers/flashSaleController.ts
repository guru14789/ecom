import { Request, Response, NextFunction } from 'express';
import { FlashSale } from '../models/FlashSale';
import { NotFoundError, AppError } from '../utils/errors';

export async function getActiveFlashSales(_req: Request, res: Response, next: NextFunction) {
  try {
    const now = new Date();
    const sales = await FlashSale.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).sort({ startDate: 1 }).lean();
    res.json({ data: sales });
  } catch (err) {
    next(err);
  }
}

export async function getFlashSaleById(req: Request, res: Response, next: NextFunction) {
  try {
    const sale = await FlashSale.findById(req.params.id).lean();
    if (!sale) throw new NotFoundError('Flash sale not found');
    res.json({ data: sale });
  } catch (err) {
    next(err);
  }
}

export async function createFlashSale(req: Request, res: Response, next: NextFunction) {
  try {
    const { title, description, banner, products, startDate, endDate } = req.body;
    const sale = await FlashSale.create({
      title, description, banner, products,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    });
    res.status(201).json({ success: true, data: sale });
  } catch (err) {
    next(err);
  }
}

export async function updateFlashSale(req: Request, res: Response, next: NextFunction) {
  try {
    const sale = await FlashSale.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!sale) throw new NotFoundError('Flash sale not found');
    res.json({ success: true, data: sale });
  } catch (err) {
    next(err);
  }
}

export async function deleteFlashSale(req: Request, res: Response, next: NextFunction) {
  try {
    const sale = await FlashSale.findByIdAndDelete(req.params.id);
    if (!sale) throw new NotFoundError('Flash sale not found');
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function getAllFlashSales(req: Request, res: Response, next: NextFunction) {
  try {
    const { status } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = {};
    const now = new Date();
    if (status === 'active') {
      filter.isActive = true;
      filter.startDate = { $lte: now };
      filter.endDate = { $gte: now };
    } else if (status === 'upcoming') {
      filter.startDate = { $gt: now };
    } else if (status === 'ended') {
      filter.endDate = { $lt: now };
    }
    const data = await FlashSale.find(filter).sort({ startDate: -1 }).lean();
    res.json({ data });
  } catch (err) {
    next(err);
  }
}
