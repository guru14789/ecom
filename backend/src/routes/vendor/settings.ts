import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authenticate';
import { getVendorById, updateVendor } from '../../lib/firestore/vendors';
import { getUserById, updateUser } from '../../lib/firestore/users';
import { NotFoundError } from '../../utils/errors';

const router = Router();

router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.user!.vendorId || req.user!.sub;
    const vendor = await getVendorById(vendorId);
    if (!vendor) throw new NotFoundError('Vendor not found');
    res.json({ data: vendor });
  } catch (err) { next(err); }
});

router.put('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.user!.vendorId || req.user!.sub;
    const { bankDetails, operatingHours, isOpen, minOrderValue, deliveryRadiusKm, ...storeData } = req.body;
    await updateVendor(vendorId, { bankDetails, operatingHours, isOpen, minOrderValue, deliveryRadiusKm, ...storeData });
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.put('/hours', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.user!.vendorId || req.user!.sub;
    await updateVendor(vendorId, { operatingHours: req.body.hours });
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.put('/toggle', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.user!.vendorId || req.user!.sub;
    await updateVendor(vendorId, { isOpen: req.body.isOpen });
    res.json({ success: true, isOpen: req.body.isOpen });
  } catch (err) { next(err); }
});

export default router;
