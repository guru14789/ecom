import { Response, NextFunction } from 'express';
import { NotificationTemplate } from '../models/NotificationTemplate';
import { AuthenticatedRequest } from '../middleware/authenticate';
import { NotFoundError } from '../utils/errors';

export async function getTemplates(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await NotificationTemplate.find().sort({ trigger: 1 }).lean();
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function createTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const template = await NotificationTemplate.create(req.body);
    res.status(201).json({ success: true, data: template });
  } catch (err) {
    next(err);
  }
}

export async function updateTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const template = await NotificationTemplate.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!template) throw new NotFoundError('Template not found');
    res.json({ success: true, data: template });
  } catch (err) {
    next(err);
  }
}

export async function deleteTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const template = await NotificationTemplate.findByIdAndDelete(req.params.id);
    if (!template) throw new NotFoundError('Template not found');
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
