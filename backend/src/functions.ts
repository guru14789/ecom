import { onRequest } from 'firebase-functions/v2/https';
import app from './app';

/**
 * Single Cloud Function that wraps the entire Express app.
 * Firebase Hosting rewrites /api/** → this function.
 * Deployed region: asia-south1 (Mumbai)
 */
export const api = onRequest(
  {
    region: 'asia-south1',
    memory: '512MiB',
    timeoutSeconds: 60,
    concurrency: 80,
  },
  app
);
