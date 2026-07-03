import { Router, Response } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { AuthenticatedRequest } from '../../middleware/authenticate';

import dashboardRouter from './dashboard';
import subscriptionRouter from './subscription';
import productRouter from './products';
import orderRouter from './orders';
import groupRouter from './groups';
import analyticsRouter from './analytics';
import couponRouter from './coupons';
import returnRouter from './returns';
import payoutRouter from './payouts';
import shipmentRouter from './shipments';
import kycRouter from './kyc';
import settingsRouter from './settings';

const router = Router();

// ─── Apply vendor auth to all routes in this namespace ────────────────────────
router.use(authenticate);
router.use(authorize('vendor', 'vendor_admin', 'platform_admin'));

// ─── Mount sub-routers ────────────────────────────────────────────────────────
router.use('/dashboard', dashboardRouter);
router.use('/subscription', subscriptionRouter);
router.use('/products', productRouter);
router.use('/orders', orderRouter);
router.use('/groups', groupRouter);
router.use('/analytics', analyticsRouter);
router.use('/coupons', couponRouter);
router.use('/returns', returnRouter);
router.use('/payouts', payoutRouter);
router.use('/shipments', shipmentRouter);
router.use('/kyc-status', kycRouter);
router.use('/kyc', kycRouter);
router.use('/settings', settingsRouter);

// ─── Inline: transaction breakdown utility ────────────────────────────────────
router.get('/breakdown', (req: AuthenticatedRequest, res: Response) => {
  const amount = parseFloat(req.query.amount as string) || 0;
  res.json({ data: {} });
});

export default router;
