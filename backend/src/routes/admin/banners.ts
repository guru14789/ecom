import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authenticate';

const router = Router();
let heroBanners: any[] = [];

router.get('/', (_req: AuthenticatedRequest, res: Response) => res.json({ data: heroBanners }));

router.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { image, mobileImage, link, title, subtitle, active, order, startDate, endDate } = req.body;
    const banner = { id: `b${Date.now()}`, image, mobileImage: mobileImage || image, link: link || '', title: title || '', subtitle: subtitle || '', active: active !== false, order: order || 0, startDate: startDate || null, endDate: endDate || null, createdAt: new Date() };
    heroBanners.push(banner);
    res.status(201).json({ success: true, data: banner });
  } catch (err) { next(err); }
});

router.put('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const idx = heroBanners.findIndex((b: any) => b.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'NOT_FOUND', message: 'Banner not found' });
    heroBanners[idx] = { ...heroBanners[idx], ...req.body, id: req.params.id };
    res.json({ success: true, data: heroBanners[idx] });
  } catch (err) { next(err); }
});

router.delete('/:id', (req: AuthenticatedRequest, res: Response) => {
  heroBanners = heroBanners.filter((b: any) => b.id !== req.params.id);
  res.json({ success: true });
});

export default router;
