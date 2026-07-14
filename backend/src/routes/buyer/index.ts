import { Router } from 'express';
import { authLimiter } from '../../middleware/rateLimiter';
import authRouter from './auth';
import productRouter from './products';
import cartRouter from './cart';
import orderRouter from './orders';
import userRouter from './users';
import groupRouter from './groups';
import reviewRouter from './reviews';
import questionRouter from './questions';
import returnRouter from './returns';
import paymentRouter from './payments';
import checkoutRouter from './checkout';
import webhookRouter from './webhook';
import chatRouter from './chat';

const router = Router();

// ─── Auth ─────────────────────────────────────────────────────────────────────
// NOTE: /cognito/* sub-paths are now embedded directly in auth.ts
router.use('/auth', authLimiter, authRouter);

// ─── Public / Buyer Product Endpoints ─────────────────────────────────────────
router.use('/products', productRouter);

// ─── Buyer Authenticated Endpoints ────────────────────────────────────────────
router.use('/cart', cartRouter);
router.use('/orders', orderRouter);
router.use('/users', userRouter);
router.use('/groups', groupRouter);
router.use('/reviews', reviewRouter);
router.use('/questions', questionRouter);
router.use('/returns', returnRouter);
router.use('/payments', paymentRouter);
router.use('/checkout', checkoutRouter);
router.use('/chat', chatRouter);

// ─── Webhook (Razorpay) ───────────────────────────────────────────────────────
router.use('/webhook', webhookRouter);

export default router;
