import { Request, Response, NextFunction } from 'express';
import { auth } from '../lib/firestore/client';
import { getUserByFirebaseUid } from '../lib/firestore/users';
import { UnauthorizedError } from '../utils/errors';

export interface JwtPayload {
  sub: string;        // Firebase UID
  phone: string;
  role: string;
  vendorId?: string;
  iat: number;
  exp: number;
  type: string;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

/**
 * Verify Firebase ID token (issued by Firebase Auth).
 * Attaches `req.user` with uid, phone, role (fetched from Firestore user doc).
 */
export const authenticate = (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new UnauthorizedError());
  }

  const token = authHeader.split(' ')[1];
  if (!token) return next(new UnauthorizedError());

  (async () => {
    try {
      const decoded = await auth.verifyIdToken(token);
      // Fetch the user's role from Firestore
      const userDoc = await getUserByFirebaseUid(decoded.uid);
      req.user = {
        sub: decoded.uid,
        phone: decoded.phone_number || '',
        role: userDoc?.role || 'buyer',
        vendorId: userDoc?.vendorId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        type: 'access',
      };
      next();
    } catch {
      next(new UnauthorizedError('Missing or invalid JWT'));
    }
  })();
};
