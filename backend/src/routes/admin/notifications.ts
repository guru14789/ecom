import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authenticate';
import { db } from '../../lib/firestore/client';

const router = Router();

router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const templates: any[] = [];
    const snapshot = await db.collection('notification_templates').get();
    snapshot.forEach(doc => templates.push({ id: doc.id, ...doc.data() }));
    res.json({ data: templates });
  } catch (err) { next(err); }
});

router.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const docRef = await db.collection('notification_templates').add(req.body);
    res.json({ success: true, data: { id: docRef.id, ...req.body } });
  } catch (err) { next(err); }
});

router.put('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await db.collection('notification_templates').doc(req.params.id).update(req.body);
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await db.collection('notification_templates').doc(req.params.id).delete();
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
