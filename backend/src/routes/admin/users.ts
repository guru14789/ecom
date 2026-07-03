import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authenticate';
import { listUsers, getUserById, updateUser } from '../../lib/firestore/users';
import { logAudit } from '../../lib/firestore/audit';
import { NotFoundError } from '../../utils/errors';

const router = Router();

router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const data = await listUsers({ limit });
    res.json({ data, pagination: { total: data.length, limit, pages: 1 } });
  } catch (err) { next(err); }
});

router.get('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = await getUserById(req.params.id);
    if (!user) throw new NotFoundError('User not found');
    res.json({ data: user });
  } catch (err) { next(err); }
});

router.put('/:id/status', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { isActive } = req.body;
    await updateUser(req.params.id, { isActive });
    await logAudit({
      actorId: req.user!.sub,
      actorType: 'admin',
      action: isActive ? 'unblock_user' : 'block_user',
      resourceType: 'user',
      resourceId: req.params.id,
    });
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.put('/:id/role', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { role } = req.body;
    await updateUser(req.params.id, { role });
    await logAudit({
      actorId: req.user!.sub,
      actorType: 'admin',
      action: 'change_user_role',
      resourceType: 'user',
      resourceId: req.params.id,
      metadata: { newRole: role },
    });
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
