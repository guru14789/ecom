import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authenticate';
import { listVendors, getVendorById, updateVendor } from '../../lib/firestore/vendors';
import { logAudit } from '../../lib/firestore/audit';
import { NotFoundError } from '../../utils/errors';

const router = Router();

router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const data = await listVendors({ limit });
    res.json({ data, pagination: { total: data.length, limit, pages: 1 } });
  } catch (err) { next(err); }
});

router.get('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const vendor = await getVendorById(req.params.id);
    if (!vendor) throw new NotFoundError('Vendor not found');
    res.json({ data: vendor });
  } catch (err) { next(err); }
});

router.put('/:id/kyc', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { status, remarks } = req.body;
    await updateVendor(req.params.id, { kycStatus: status });
    await logAudit({
      actorId: req.user!.sub,
      actorType: 'admin',
      action: 'update_vendor_kyc',
      resourceType: 'vendor',
      resourceId: req.params.id,
      metadata: { status, remarks },
    });
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.put('/:id/status', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { isActive } = req.body;
    await updateVendor(req.params.id, { isActive });
    await logAudit({
      actorId: req.user!.sub,
      actorType: 'admin',
      action: isActive ? 'unblock_vendor' : 'block_vendor',
      resourceType: 'vendor',
      resourceId: req.params.id,
    });
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
