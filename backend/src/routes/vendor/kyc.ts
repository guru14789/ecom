import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authenticate';
import { getVendorById, updateVendor } from '../../lib/firestore/vendors';
import { NotFoundError } from '../../utils/errors';

const router = Router();

router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.user!.vendorId || req.user!.sub;
    const vendor = await getVendorById(vendorId);
    if (!vendor) throw new NotFoundError('Vendor not found');
    res.json({ data: { kycStatus: vendor.kycStatus, kycDocuments: vendor.kycDocuments } });
  } catch (err) { next(err); }
});

router.post('/submit', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.user!.vendorId || req.user!.sub;
    await updateVendor(vendorId, { kycDocuments: req.body.documents, kycStatus: 'pending' });
    res.json({ success: true, message: 'KYC submitted for review' });
  } catch (err) { next(err); }
});

export default router;
