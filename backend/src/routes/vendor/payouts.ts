import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authenticate';
import { getPayoutsByVendor } from '../../lib/firestore/payouts';
import { getVendorById } from '../../lib/firestore/vendors';

const router = Router();

router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.user!.vendorId || req.user!.sub;
    const payouts = await getPayoutsByVendor(vendorId);
    res.json({ data: payouts });
  } catch (err) { next(err); }
});

router.get('/bank-details', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.user!.vendorId || req.user!.sub;
    const vendor = await getVendorById(vendorId);
    res.json({ data: vendor?.bankDetails || {} });
  } catch (err) { next(err); }
});

export default router;
