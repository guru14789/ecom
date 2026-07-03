import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../../middleware/authenticate';
import { createReturn, getReturnById } from '../../lib/firestore/returns';
import { db } from '../../lib/firestore/client';

const router = Router();

router.use(authenticate);

router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const returns: any[] = [];
    const snapshot = await db.collection('return_requests')
      .where('userId', '==', req.user!.sub)
      .orderBy('createdAt', 'desc')
      .get();
    snapshot.forEach(doc => returns.push({ id: doc.id, ...doc.data() }));
    res.json({ data: returns });
  } catch (err) { next(err); }
});

router.get('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const data = await getReturnById(req.params.id);
    if (!data || data.userId !== req.user!.sub) return res.status(404).json({ error: 'NOT_FOUND', message: 'Return request not found' });
    res.json({ data });
  } catch (err) { next(err); }
});

router.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Standard return creation logic
    const data = await createReturn({
      ...req.body,
      userId: req.user!.sub,
      status: 'pending',
    });
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

export default router;
