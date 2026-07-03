import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../../middleware/authenticate';
import { getGroupByShareCode, joinGroup } from '../../lib/firestore/groups';

const router = Router();

router.use(authenticate);

router.get('/:shareCode', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const session = await getGroupByShareCode(req.params.shareCode);
    if (!session) return res.status(404).json({ error: 'NOT_FOUND', message: 'Group session not found' });
    res.json({ data: session });
  } catch (err) { next(err); }
});

router.post('/:shareCode/join', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const session = await getGroupByShareCode(req.params.shareCode);
    if (!session) return res.status(404).json({ error: 'NOT_FOUND', message: 'Group session not found' });
    if (!session.id) return res.status(400).json({ error: 'INVALID_DATA' });
    
    await joinGroup(session.id, req.user!.sub);
    res.json({ success: true, message: 'Joined group successfully' });
  } catch (err) { next(err); }
});

export default router;
