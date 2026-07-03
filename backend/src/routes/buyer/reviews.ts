import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../../middleware/authenticate';
import { db } from '../../lib/firestore/client';
import admin from 'firebase-admin';

const router = Router();

router.get('/:productId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const reviews: any[] = [];
    const snapshot = await db.collection('reviews')
      .where('productId', '==', req.params.productId)
      .orderBy('createdAt', 'desc')
      .get();
    snapshot.forEach(doc => reviews.push({ id: doc.id, ...doc.data() }));
    res.json({ data: reviews });
  } catch (err) { next(err); }
});

router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const docRef = await db.collection('reviews').add({
      ...req.body,
      userId: req.user!.sub,
      createdAt: admin.firestore.Timestamp.now(),
      likes: 0,
      dislikes: 0,
    });
    res.json({ success: true, data: { id: docRef.id } });
  } catch (err) { next(err); }
});

router.put('/:id/helpful', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { action } = req.body; // 'like' or 'dislike'
    await db.collection('reviews').doc(req.params.id).update({
      [action + 's']: admin.firestore.FieldValue.increment(1)
    });
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
