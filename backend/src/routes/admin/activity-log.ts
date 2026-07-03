import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authenticate';
import { getAuditLog } from '../../lib/firestore/audit';

const router = Router();

router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const data = await getAuditLog({ limit });
    res.json({ data, pagination: { total: data.length, limit, pages: 1 } });
  } catch (err) { next(err); }
});

export default router;
