import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authenticate';
import { listProducts, getProductById } from '../../lib/firestore/products';
import { getGroupByShareCode, createGroup } from '../../lib/firestore/groups';
import { NotFoundError } from '../../utils/errors';
import admin from 'firebase-admin';

const router = Router();

router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.user!.vendorId || req.user!.sub;
    const products = await listProducts({ vendorId, isActive: true, limit: 20 });
    res.json({ data: products.filter((p) => (p.targetCount || 0) > 0) });
  } catch (err) { next(err); }
});

router.get('/:shareCode', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const session = await getGroupByShareCode(req.params.shareCode);
    if (!session) throw new NotFoundError('Group session not found');
    const product = await getProductById(session.productId);
    res.json({ data: { session, product } });
  } catch (err) { next(err); }
});

router.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { productId, targetCount, endsAt } = req.body;
    const product = await getProductById(productId);
    if (!product) throw new NotFoundError('Product not found');

    const shareCode = Math.random().toString(36).slice(2, 8).toUpperCase();
    const session = await createGroup({
      productId,
      hostUserId: req.user!.sub,
      targetCount,
      currentCount: 1,
      shareCode,
      status: 'active',
      participants: [req.user!.sub],
      endsAt: admin.firestore.Timestamp.fromDate(new Date(endsAt)),
    });
    res.status(201).json({ success: true, data: session });
  } catch (err) { next(err); }
});

export default router;
