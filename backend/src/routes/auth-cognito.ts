import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { User } from '../models/User';
import { signUp, signIn, adminCreateUser } from '../services/cognito.service';
import { AppError } from '../utils/errors';
import { AuthenticatedRequest } from '../middleware/authenticate';

const router = Router();

function generateAccessToken(user: { id: string; phoneNumber: string; role: string; vendorId?: string }): string {
  return jwt.sign(
    { sub: user.id, phone: user.phoneNumber, role: user.role, vendorId: user.vendorId, type: 'access' },
    env.JWT_SECRET,
    { expiresIn: env.ACCESS_TOKEN_EXPIRY }
  );
}

function generateRefreshToken(user: { id: string; phoneNumber: string }): string {
  return jwt.sign(
    { sub: user.id, phone: user.phoneNumber, type: 'refresh' },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.REFRESH_TOKEN_EXPIRY }
  );
}

async function upsertUser(cognitoSub: string, email: string, phoneNumber?: string) {
  let user = await User.findOne({ cognitoSub });
  if (!user) {
    user = await User.findOne({ email });
  }
  if (!user) {
    user = await User.create({
      email,
      phoneNumber: phoneNumber || '',
      isPhoneVerified: true,
      role: 'buyer',
      cognitoSub,
      referralCode: `SHOPYNG${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    });
  } else if (!user.cognitoSub) {
    user.cognitoSub = cognitoSub;
    await user.save();
  }
  return user;
}

router.post('/signup', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, phoneNumber } = req.body;
    if (!email || !password) {
      throw new AppError('VALIDATION_ERROR', 'Email and password are required', 422);
    }
    if (password.length < 8) {
      throw new AppError('VALIDATION_ERROR', 'Password must be at least 8 characters', 422);
    }

    const result = await signUp(email, password, phoneNumber);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/signin', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new AppError('VALIDATION_ERROR', 'Email and password are required', 422);
    }

    const cognitoResult = await signIn(email, password);

    let user = await User.findOne({ email });
    if (!user && cognitoResult.idToken) {
      const decoded = jwt.decode(cognitoResult.idToken) as any;
      const cognitoSub = decoded?.sub;
      user = await upsertUser(cognitoSub, email);
    }

    if (!user) {
      throw new AppError('NOT_FOUND', 'User not found in local store', 404);
    }

    const accessToken = generateAccessToken({
      id: user._id,
      phoneNumber: user.phoneNumber,
      role: user.role,
      vendorId: user.vendorId,
    });

    const refreshToken = generateRefreshToken({
      id: user._id,
      phoneNumber: user.phoneNumber,
    });

    res.json({
      success: true,
      accessToken,
      refreshToken,
      cognitoTokens: {
        accessToken: cognitoResult.accessToken,
        idToken: cognitoResult.idToken,
        refreshToken: cognitoResult.refreshToken,
      },
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName || null,
        phoneNumber: user.phoneNumber,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/admin-create', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, phoneNumber } = req.body;
    if (!email || !password) {
      throw new AppError('VALIDATION_ERROR', 'Email and password are required', 422);
    }

    await adminCreateUser(email, password, phoneNumber);
    res.status(201).json({ success: true, message: 'User created in Cognito' });
  } catch (err) {
    next(err);
  }
});

export default router;
