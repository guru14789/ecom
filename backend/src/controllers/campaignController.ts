import { Response, NextFunction } from 'express';
import { Campaign } from '../models/Campaign';
import { AuthenticatedRequest } from '../middleware/authenticate';
import { NotFoundError } from '../utils/errors';

export async function getCampaigns(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { status } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    const data = await Campaign.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function createCampaign(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const campaign = await Campaign.create({ ...req.body, createdBy: req.user!.sub });
    res.status(201).json({ success: true, data: campaign });
  } catch (err) {
    next(err);
  }
}

export async function updateCampaign(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const campaign = await Campaign.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!campaign) throw new NotFoundError('Campaign not found');
    res.json({ success: true, data: campaign });
  } catch (err) {
    next(err);
  }
}

export async function deleteCampaign(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const campaign = await Campaign.findByIdAndDelete(req.params.id);
    if (!campaign) throw new NotFoundError('Campaign not found');
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function sendCampaign(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      { status: 'sending', sentAt: new Date() },
      { new: true }
    );
    if (!campaign) throw new NotFoundError('Campaign not found');
    res.json({ success: true, data: campaign });
  } catch (err) {
    next(err);
  }
}
