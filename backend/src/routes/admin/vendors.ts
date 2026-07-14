import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authenticate';
import { listVendors, getVendorById, updateVendor, updateVendorRegistrationStatus } from '../../lib/firestore/vendors';
import { logAudit } from '../../lib/firestore/audit';
import { NotFoundError } from '../../utils/errors';
import { notifyVendorKycApproved, notifyVendorKycRejected } from '../../services/notification.service';

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

// PUT /api/admin/vendors/:id/kyc — Update KYC status (legacy)
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

// PUT /api/admin/vendors/:id/approve — Approve vendor onboarding
router.put('/:id/approve', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const vendor = await getVendorById(req.params.id);
    if (!vendor) throw new NotFoundError('Vendor not found');

    await updateVendorRegistrationStatus(req.params.id, 'approved', {
      approvedBy: req.user!.sub,
    });

    // Notify vendor
    notifyVendorKycApproved(req.params.id);

    await logAudit({
      actorId: req.user!.sub,
      actorType: 'admin',
      action: 'approve_vendor',
      resourceType: 'vendor',
      resourceId: req.params.id,
      metadata: { storeName: vendor.storeName },
    });

    res.json({ success: true, message: 'Vendor approved successfully' });
  } catch (err) { next(err); }
});

// PUT /api/admin/vendors/:id/reject — Reject vendor onboarding
router.put('/:id/reject', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const vendor = await getVendorById(req.params.id);
    if (!vendor) throw new NotFoundError('Vendor not found');

    const { reason } = req.body;

    await updateVendorRegistrationStatus(req.params.id, 'rejected', {
      rejectionReason: reason,
    });

    // Notify vendor
    notifyVendorKycRejected(req.params.id, reason);

    await logAudit({
      actorId: req.user!.sub,
      actorType: 'admin',
      action: 'reject_vendor',
      resourceType: 'vendor',
      resourceId: req.params.id,
      metadata: { storeName: vendor.storeName, reason },
    });

    res.json({ success: true, message: 'Vendor rejected' });
  } catch (err) { next(err); }
});

// PUT /api/admin/vendors/:id/status — Toggle active state
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
