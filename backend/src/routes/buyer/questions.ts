import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../../middleware/authenticate';
import { db } from '../../lib/firestore/client';
import admin from 'firebase-admin';

const router = Router();

router.get('/:productId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const questions: any[] = [];
    const snapshot = await db.collection('questions')
      .where('productId', '==', req.params.productId)
      .orderBy('createdAt', 'desc')
      .get();
    snapshot.forEach(doc => questions.push({ id: doc.id, ...doc.data() }));
    res.json({ data: questions });
  } catch (err) { next(err); }
});

router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { productId, question } = req.body;
    const docRef = await db.collection('questions').add({
      productId,
      userId: req.user!.sub,
      question,
      answers: [],
      createdAt: admin.firestore.Timestamp.now()
    });
    res.json({ success: true, data: { id: docRef.id } });
  } catch (err) { next(err); }
});

export default router;
