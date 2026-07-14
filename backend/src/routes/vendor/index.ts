import { Router, Response } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { requireVendorAdmin } from '../../middleware/vendorRoles';
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
import notificationsRouter from './notifications';
import chatRouter from './chat';
import crmRouter from './crm';
import uploadRouter from './upload';
import campaignRouter from './campaigns';
import shippingConfigRouter from './shipping-config';
import vendorReviewsRouter from './vendor-reviews';

const router = Router();

// ─── Apply vendor auth to all routes in this namespace ────────────────────────
router.use(authenticate);
router.use(authorize('vendor', 'vendor_admin', 'platform_admin'));

// ─── Mount sub-routers ────────────────────────────────────────────────────────
router.use('/dashboard', dashboardRouter);
router.use('/products', productRouter);
router.use('/orders', orderRouter);
router.use('/shipments', shipmentRouter);
router.use('/notifications', notificationsRouter);
router.use('/chat', chatRouter);
router.use('/upload', uploadRouter);

// Sensitive routes (Admin only)
router.use('/subscription', requireVendorAdmin, subscriptionRouter);
router.use('/groups', requireVendorAdmin, groupRouter);
router.use('/analytics', requireVendorAdmin, analyticsRouter);
router.use('/coupons', requireVendorAdmin, couponRouter);
router.use('/returns', requireVendorAdmin, returnRouter);
router.use('/payouts', requireVendorAdmin, payoutRouter);
router.use('/kyc-status', requireVendorAdmin, kycRouter);
router.use('/kyc', requireVendorAdmin, kycRouter);
router.use('/settings', requireVendorAdmin, settingsRouter);
router.use('/crm', requireVendorAdmin, crmRouter);
router.use('/campaigns', requireVendorAdmin, campaignRouter);
router.use('/shipping-config', requireVendorAdmin, shippingConfigRouter);
router.use('/reviews', requireVendorAdmin, vendorReviewsRouter);

// ─── Inline: transaction breakdown utility ────────────────────────────────────
router.get('/breakdown', (req: AuthenticatedRequest, res: Response) => {
  const amount = parseFloat(req.query.amount as string) || 0;
  res.json({ data: {} });
});

export default router;
