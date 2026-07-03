import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authenticate';
import { listProducts, getProductById, updateProduct, deleteProduct } from '../../lib/firestore/products';
import { NotFoundError } from '../../utils/errors';

const router = Router();

router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const data = await listProducts({ limit });
    res.json({ data, pagination: { total: data.length, limit, pages: 1 } });
  } catch (err) { next(err); }
});

router.get('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const product = await getProductById(req.params.id);
    if (!product) throw new NotFoundError('Product not found');
    res.json({ data: product });
  } catch (err) { next(err); }
});

router.put('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await updateProduct(req.params.id, req.body);
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await deleteProduct(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.put('/:id/feature', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await updateProduct(req.params.id, { isFeatured: req.body.isFeatured });
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
