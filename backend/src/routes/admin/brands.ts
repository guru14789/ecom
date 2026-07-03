import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authenticate';

const router = Router();
let brands: any[] = [];

router.get('/', (_req: AuthenticatedRequest, res: Response) => res.json({ data: brands }));

router.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { name, logo, description } = req.body;
    if (!name) return res.status(422).json({ error: 'VALIDATION_ERROR', message: 'Brand name required' });
    const brand = { id: `br${Date.now()}`, name, logo: logo || '', description: description || '', approved: true, createdAt: new Date() };
    brands.push(brand);
    res.status(201).json({ success: true, data: brand });
  } catch (err) { next(err); }
});

router.put('/:id', (req: AuthenticatedRequest, res: Response) => {
  const idx = brands.findIndex((b: any) => b.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'NOT_FOUND', message: 'Brand not found' });
  brands[idx] = { ...brands[idx], ...req.body, id: req.params.id };
  res.json({ success: true, data: brands[idx] });
});

router.delete('/:id', (req: AuthenticatedRequest, res: Response) => {
  brands = brands.filter((b: any) => b.id !== req.params.id);
  res.json({ success: true });
});

export default router;
