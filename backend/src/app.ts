import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { apiLimiter, authLimiter, uploadLimiter } from './middleware/rateLimiter';
import mongoose from 'mongoose';
import { env } from './config/env';

import authRouter from './routes/auth';
import authCognitoRouter from './routes/auth-cognito';
import productRouter from './routes/products';
import cartRouter from './routes/cart';
import orderRouter from './routes/orders';
import groupRouter from './routes/groups';
import userRouter from './routes/users';
import vendorRouter from './routes/vendor';
import adminRouter from './routes/admin';
import webhookRouter from './routes/webhook';
import paymentRouter from './routes/payments';
import reviewRouter from './routes/reviews';
import questionRouter from './routes/questions';
import checkoutRouter from './routes/checkout';
import returnRouter from './routes/returns';
import disputeRouter from './routes/disputes';
import payoutRouter from './routes/payouts';
import flashSaleRouter from './routes/flash-sales';
import campaignRouter from './routes/campaigns';
import notificationTemplateRouter from './routes/notification-templates';
import { initPostgres } from './config/postgres';
import { initDynamoDBTables } from './services/dynamodb.service';

const app = express();

mongoose.connect(env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

initPostgres()
  .then(() => console.log('PostgreSQL connected'))
  .catch((err: Error) => console.warn('PostgreSQL unavailable (non-fatal):', err.message));

initDynamoDBTables()
  .then(() => console.log('DynamoDB tables initialized'))
  .catch((err: Error) => console.warn('DynamoDB unavailable (non-fatal):', err.message));

app.use(helmet());
const allowedOrigins = [
  env.CLIENT_URL,
  'http://localhost:3100',
  'http://localhost:3200',
];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) {
      cb(null, true);
    } else {
      cb(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
}));
app.use(express.json({
  limit: '10mb',
  verify: (req: any, _res: any, buf: Buffer) => {
    req.rawBody = buf.toString();
  },
}));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.use(apiLimiter);

app.get('/health', async (_req: Request, res: Response) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'ok' : 'error';
  res.json({
    status: 'healthy',
    version: process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString(),
    services: { database: dbStatus },
  });
});

app.use('/api/auth', authLimiter, authRouter);
app.use('/api/auth/cognito', authCognitoRouter);
app.use('/api/products', productRouter);
app.use('/api/cart', cartRouter);
app.use('/api/orders', orderRouter);
app.use('/api/groups', groupRouter);
app.use('/api/users', userRouter);
app.use('/api/vendor', vendorRouter);
app.use('/api/admin', adminRouter);
app.use('/api/webhook', webhookRouter);
app.use('/api/payments', paymentRouter);
app.use('/api/reviews', reviewRouter);
app.use('/api/questions', questionRouter);
app.use('/api/checkout', checkoutRouter);
app.use('/api/returns', returnRouter);
app.use('/api/disputes', disputeRouter);
app.use('/api/payouts', payoutRouter);
app.use('/api/flash-sales', flashSaleRouter);
app.use('/api/campaigns', campaignRouter);
app.use('/api/notification-templates', notificationTemplateRouter);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found', statusCode: 404 } });
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    error: { code, message, statusCode, details: err.details || undefined },
  });
});

export default app;
