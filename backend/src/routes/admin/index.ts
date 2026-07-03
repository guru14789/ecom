import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

import dashboardRouter from './dashboard';
import vendorRouter from './vendors';
import productRouter from './products';
import orderRouter from './orders';
import userRouter from './users';
import analyticsRouter from './analytics';
import categoryRouter from './categories';
import reportRouter from './reports';
import bannerRouter from './banners';
import brandRouter from './brands';
import activityLogRouter from './activity-log';
import campaignRouter from './campaigns';
import flashSaleRouter from './flash-sales';
import disputeRouter from './disputes';
import notificationRouter from './notifications';
import payoutRouter from './payouts';

const router = Router();

// ─── Apply admin auth to all routes in this namespace ─────────────────────────
router.use(authenticate);
router.use(authorize('platform_admin', 'super_admin'));

// ─── Mount sub-routers ────────────────────────────────────────────────────────
router.use('/dashboard', dashboardRouter);
router.use('/vendors', vendorRouter);
router.use('/products', productRouter);
router.use('/orders', orderRouter);
router.use('/users', userRouter);
router.use('/analytics', analyticsRouter);
router.use('/categories', categoryRouter);
router.use('/reports', reportRouter);
router.use('/banners', bannerRouter);
router.use('/brands', brandRouter);
router.use('/activity-log', activityLogRouter);
router.use('/campaigns', campaignRouter);
router.use('/flash-sales', flashSaleRouter);
router.use('/disputes', disputeRouter);
router.use('/notification-templates', notificationRouter);
router.use('/payouts', payoutRouter);

export default router;
