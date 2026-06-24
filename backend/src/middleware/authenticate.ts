import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UnauthorizedError } from '../utils/errors';
import { verifyCognitoToken } from '../services/cognito-jwt';
import { verifyFirebaseToken } from '../services/firebase-admin';

export interface JwtPayload {
  sub: string;
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

export const authenticate = (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError());
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return next(new UnauthorizedError());
  }

  (async () => {
    // Try Firebase first (primary auth)
    try {
      const firebaseUser = await verifyFirebaseToken(token);
      req.user = {
        sub: firebaseUser.uid,
        phone: firebaseUser.phone_number || '',
        role: 'buyer',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        type: 'access',
      };
      return next();
    } catch {
      // Not a Firebase token — fall through
    }

    // Fallback: local JWT
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
      if (payload.type !== 'access') {
        return next(new UnauthorizedError('Invalid token type'));
      }
      req.user = payload;
      return next();
    } catch {
      // Not a local JWT — try Cognito
    }

    // Fallback: Cognito
    try {
      const cognitoPayload = await verifyCognitoToken(token);
      req.user = {
        sub: cognitoPayload.sub,
        phone: cognitoPayload.phone_number || '',
        role: (cognitoPayload as any)['custom:role'] || 'buyer',
        iat: cognitoPayload.iat || 0,
        exp: cognitoPayload.exp || 0,
        type: 'access',
      };
      next();
    } catch {
      return next(new UnauthorizedError('Invalid token'));
    }
  })();
};
