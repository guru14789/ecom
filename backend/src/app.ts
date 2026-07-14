import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { apiLimiter } from './middleware/rateLimiter';
import { db } from './lib/firestore/client'; // initializes Firebase Admin

// ─── Unified Role-Based Routers ───────────────────────────────────────────────
import buyerRouter from './routes/buyer';
import vendorRouter from './routes/vendor';
import adminRouter from './routes/admin';
import vendorRegisterRouter from './routes/public/vendor-register';
import shippingRouter from './routes/public/shipping';
import publicJobsRouter from './routes/public/jobs';

const app = express();

// ─── Core Middleware ──────────────────────────────────────────────────────────
app.use(helmet());

const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:3000',
  'http://localhost:3100',
  'http://localhost:3200',
  'http://localhost:5173',
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

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', async (_req: Request, res: Response) => {
  let dbStatus = 'ok';
  try {
    await db.collection('_health').doc('ping').set({ ts: new Date() });
    dbStatus = 'ok';
  } catch {
    dbStatus = 'error';
  }
  res.json({
    status: 'healthy',
    version: process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString(),
    services: { database: dbStatus, provider: 'firestore' },
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api', buyerRouter);
app.use('/api/public/vendor/register', vendorRegisterRouter);
app.use('/api/public/shipping', shippingRouter);
app.use('/api/public/jobs', publicJobsRouter);
app.use('/api/vendor', vendorRouter);
app.use('/api/admin', adminRouter);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Route not found', statusCode: 404 },
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
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
