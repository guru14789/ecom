import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authenticate';
import { listDisputes, updateDispute } from '../../lib/firestore/disputes';

const router = Router();

router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const data = await listDisputes({});
    res.json({ data });
  } catch (err) { next(err); }
});

router.put('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await updateDispute(req.params.id, req.body);
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
