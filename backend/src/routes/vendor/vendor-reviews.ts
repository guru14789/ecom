import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authenticate';
import { db } from '../../lib/firestore/client';
import { listProducts } from '../../lib/firestore/products';
import admin from 'firebase-admin';
import { auditLog } from '../../services/audit.service';

const router = Router();

// GET /api/vendor/reviews — All reviews for this vendor's products
router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.user!.vendorId || req.user!.sub;

    // Fetch vendor's product IDs
    const products = await listProducts({ vendorId, limit: 1000 });
    const productIds = products.map(p => p.id);

    if (productIds.length === 0) {
      return res.json({ data: [], totalCount: 0 });
    }

    // Firestore 'in' queries are limited to 30 items — batch if needed
    const BATCH_SIZE = 30;
    const reviews: any[] = [];
    for (let i = 0; i < productIds.length; i += BATCH_SIZE) {
      const batch = productIds.slice(i, i + BATCH_SIZE);
      const snap = await db.collection('reviews')
        .where('productId', 'in', batch)
        .orderBy('createdAt', 'desc')
        .get();
      snap.docs.forEach(doc => reviews.push({ id: doc.id, ...doc.data() }));
    }

    // Attach product name to each review
    const productMap = new Map(products.map(p => [p.id, p.name]));
    const enriched = reviews.map(r => ({
      ...r,
      productName: productMap.get(r.productId) || 'Unknown Product',
    }));

    // Sort combined results by date
    enriched.sort((a, b) => {
      const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return bTime - aTime;
    });

    const limit = parseInt(req.query.limit as string) || 50;
    res.json({ data: enriched.slice(0, limit), totalCount: enriched.length });
  } catch (err) { next(err); }
});

// POST /api/vendor/reviews/:id/reply — Add vendor reply to a review
router.post('/:id/reply', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.user!.vendorId || req.user!.sub;
    const { reply } = req.body;

    if (!reply?.trim()) {
      return res.status(422).json({ error: 'VALIDATION_ERROR', message: 'Reply text is required' });
    }

    const reviewRef = db.collection('reviews').doc(req.params.id);
    const reviewDoc = await reviewRef.get();

    if (!reviewDoc.exists) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Review not found' });
    }

    await reviewRef.update({
      vendorReply: reply.trim(),
      vendorReplyAt: admin.firestore.Timestamp.now(),
    });

    auditLog({
      actorId: req.user!.sub,
      actorType: 'vendor',
      action: 'reply_review',
      resourceType: 'review',
      resourceId: req.params.id,
    });

    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
