import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authenticate';
import { listCategories, createCategory, updateCategory } from '../../lib/firestore/categories';
import { db } from '../../lib/firestore/client';

const router = Router();

router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const data = await listCategories();
    res.json({ data });
  } catch (err) { next(err); }
});

router.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const category = await createCategory({
      ...req.body,
      key: req.body.key || req.body.name.toLowerCase().replace(/\s+/g, '-'),
      isActive: true,
      subcategories: req.body.subcategories || [],
      order: req.body.order || 0
    });
    res.status(201).json({ success: true, data: category });
  } catch (err) { next(err); }
});

router.put('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await updateCategory(req.params.id, req.body);
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await db.collection('categories').doc(req.params.id).delete();
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
