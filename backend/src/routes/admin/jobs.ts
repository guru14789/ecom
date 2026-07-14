import { Router, Response, NextFunction } from 'express';
import { listJobs, createJob, updateJob, deleteJob } from '../../lib/firestore/jobs';
import { AuthenticatedRequest } from '../../middleware/authenticate';
import { auditLog } from '../../services/audit.service';

const router = Router();

// GET /api/admin/jobs
router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const data = await listJobs(false);
    res.json({ data });
  } catch (err) { next(err); }
});

// POST /api/admin/jobs
router.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { role, dept, location, isActive } = req.body;
    if (!role || !dept || !location) {
      return res.status(422).json({ error: 'VALIDATION_ERROR', message: 'Role, Department, and Location are required' });
    }
    const job = await createJob({
      role,
      dept,
      location,
      isActive: isActive !== undefined ? isActive : true,
    });

    auditLog({
      actorId: req.user!.sub,
      actorType: 'admin',
      action: 'create_job',
      resourceType: 'job',
      resourceId: job.id,
      metadata: { role, dept, location },
    });

    res.status(201).json({ success: true, data: job });
  } catch (err) { next(err); }
});

// PUT /api/admin/jobs/:id
router.put('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { role, dept, location, isActive } = req.body;
    await updateJob(req.params.id, { role, dept, location, isActive });

    auditLog({
      actorId: req.user!.sub,
      actorType: 'admin',
      action: 'update_job',
      resourceType: 'job',
      resourceId: req.params.id,
      metadata: { role, dept, location, isActive },
    });

    res.json({ success: true });
  } catch (err) { next(err); }
});

// DELETE /api/admin/jobs/:id
router.delete('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await deleteJob(req.params.id);

    auditLog({
      actorId: req.user!.sub,
      actorType: 'admin',
      action: 'delete_job',
      resourceType: 'job',
      resourceId: req.params.id,
    });

    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
