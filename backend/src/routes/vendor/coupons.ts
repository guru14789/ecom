import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authenticate';
import { listCoupons, createCoupon, getCouponByCode } from '../../lib/firestore/coupons';
import admin from 'firebase-admin';

const router = Router();

router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.user!.vendorId || req.user!.sub;
    const data = await listCoupons(vendorId);
    res.json({ data });
  } catch (err) { next(err); }
});

router.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.user!.vendorId || req.user!.sub;
    const coupon = await createCoupon({
      ...req.body,
      vendorId,
      isActive: true,
      validFrom: admin.firestore.Timestamp.fromDate(new Date(req.body.validFrom)),
      validTo: admin.firestore.Timestamp.fromDate(new Date(req.body.validTo)),
    });
    res.status(201).json({ success: true, data: coupon });
  } catch (err) { next(err); }
});

export default router;
