import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authenticate';
import { getVendorById } from '../lib/firestore/vendors';
import { AppError } from '../utils/errors';

export const requireVendorAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const vendorId = req.user!.vendorId || req.user!.sub;
    const vendor = await getVendorById(vendorId);

    if (!vendor) {
      return next(new AppError('NOT_FOUND', 'Vendor not found', 404));
    }

    // Owner is admin
    if (vendor.userId === req.user!.sub) {
      return next();
    }

    // Check staff array
    const staffMember = vendor.staff?.find(s => s.userId === req.user!.sub);
    if (!staffMember || staffMember.role !== 'admin') {
      return next(new AppError('FORBIDDEN', 'Requires vendor admin privileges', 403));
    }

    next();
  } catch (err) {
    next(err);
  }
};
