import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authenticate';
import { getVendorById, updateVendor } from '../../lib/firestore/vendors';
import { getUserById, getUserByEmail, updateUser } from '../../lib/firestore/users';
import { NotFoundError, AppError } from '../../utils/errors';
import admin from '../../lib/firestore/client';

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
    const { inviteStaff, removeStaff, bankDetails, operatingHours, isOpen, minOrderValue, deliveryRadiusKm, ...storeData } = req.body;

    const vendor = await getVendorById(vendorId);
    if (!vendor) throw new NotFoundError('Vendor not found');

    if (inviteStaff) {
      const user = await getUserByEmail(inviteStaff.email);
      if (!user) throw new AppError('NOT_FOUND', 'User with this email not found', 404);
      if (user.role === 'vendor' && user.vendorId && user.vendorId !== vendorId) {
        throw new AppError('CONFLICT', 'User is already staff for another vendor', 409);
      }

      const newStaff = {
        userId: user.id,
        role: inviteStaff.role || 'staff',
        email: user.email!,
        name: user.fullName || user.email!.split('@')[0],
      };

      await updateVendor(vendorId, {
        staff: admin.firestore.FieldValue.arrayUnion(newStaff) as any
      });
      await updateUser(user.id, { role: 'vendor', vendorId });
    } else if (removeStaff) {
      // Find the staff member to remove
      const staffMember = vendor.staff?.find(s => s.userId === removeStaff);
      if (staffMember) {
        await updateVendor(vendorId, {
          staff: admin.firestore.FieldValue.arrayRemove(staffMember) as any
        });
        await updateUser(removeStaff, { role: 'buyer', vendorId: '' }); // Revert to buyer
      }
    } else {
      await updateVendor(vendorId, { bankDetails, operatingHours, isOpen, minOrderValue, deliveryRadiusKm, ...storeData });
    }

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
