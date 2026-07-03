import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authenticate';
import { NotFoundError } from '../../utils/errors';
import { listProducts, createProduct, updateProduct, getProductById, deleteProduct } from '../../lib/firestore/products';
import { generateUploadUrl } from '../../services/cloudflare-r2';
import { checkProductLimit } from '../../services/subscription.service';

const router = Router();

router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.user!.vendorId || req.user!.sub;
    const data = await listProducts({ vendorId, limit: parseInt(req.query.limit as string) || 20, startAfter: req.query.startAfter as string });
    res.json({ data });
  } catch (err) { next(err); }
});

router.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.user!.vendorId || req.user!.sub;
    const existing = await listProducts({ vendorId, limit: 1000 });
    const canAdd = await checkProductLimit(vendorId, existing.length);
    if (!canAdd) return res.status(403).json({ error: 'LIMIT_EXCEEDED', message: 'Product limit reached. Upgrade subscription.' });

    const product = await createProduct({
      ...req.body,
      vendorId,
      slug: req.body.slug || `${req.body.name?.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      images: req.body.images || [],
      specs: req.body.specs || [],
      highlights: req.body.highlights || [],
      variants: req.body.variants || [],
      tags: req.body.tags || [],
      rating: 0,
      reviews: 0,
      sponsored: false,
      isActive: true,
      isFeatured: false,
      targetCount: req.body.targetCount || 0,
    });
    res.status(201).json({ success: true, data: product });
  } catch (err) { next(err); }
});

router.put('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const product = await getProductById(req.params.id);
    if (!product) throw new NotFoundError('Product not found');
    await updateProduct(req.params.id, req.body);
    res.json({ success: true, data: { ...product, ...req.body } });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await deleteProduct(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.post('/upload-url', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { filename, contentType, folder = 'products' } = req.body;
    const result = await generateUploadUrl(filename, contentType, folder);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

export default router;
