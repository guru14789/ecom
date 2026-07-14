import { Router, Response, NextFunction } from 'express';
import { listJobs } from '../../lib/firestore/jobs';

const router = Router();

// GET /api/public/jobs
router.get('/', async (req, res: Response, next: NextFunction) => {
  try {
    const data = await listJobs(true);
    res.json({ data });
  } catch (err) { next(err); }
});

export default router;
