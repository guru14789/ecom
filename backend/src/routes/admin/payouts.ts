import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authenticate';
import { db } from '../../lib/firestore/client';

const router = Router();

router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const payouts: any[] = [];
    const snapshot = await db.collection('payouts').orderBy('createdAt', 'desc').get();
    snapshot.forEach(doc => payouts.push({ id: doc.id, ...doc.data() }));
    res.json({ data: payouts });
  } catch (err) { next(err); }
});

router.put('/:id/status', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await db.collection('payouts').doc(req.params.id).update({ status: req.body.status });
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
