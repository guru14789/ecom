import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { env } from '../config/env';
import { sendOtp, verifyOtp } from '../services/otp.service';
import { normalizePhone, generateId } from '../utils/helpers';
import { AppError } from '../utils/errors';
import { AuthenticatedRequest } from '../middleware/authenticate';

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

export async function sendOtpHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      throw new AppError('VALIDATION_ERROR', 'Phone number is required', 422);
    }

    const normalizedPhone = normalizePhone(phoneNumber);
    await sendOtp(normalizedPhone);

    res.json({
      success: true,
      message: 'OTP sent successfully',
      expiresIn: 300,
    });
  } catch (err) {
    next(err);
  }
}

export async function verifyOtpHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { phoneNumber, otp } = req.body;
    if (!phoneNumber || !otp) {
      throw new AppError('VALIDATION_ERROR', 'Phone number and OTP are required', 422);
    }

    const normalizedPhone = normalizePhone(phoneNumber);
    const isValid = await verifyOtp(normalizedPhone, otp);

    if (!isValid) {
      throw new AppError('VALIDATION_ERROR', 'Invalid OTP', 422);
    }

    let user = await User.findOne({ phoneNumber: normalizedPhone });

    if (!user) {
      user = await User.create({
        phoneNumber: normalizedPhone,
        isPhoneVerified: true,
        role: 'buyer',
        referralCode: `SHOPSYY${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      });
    } else {
      user.isPhoneVerified = true;
      user.lastLoginAt = new Date();
      await user.save();
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

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    user.refreshTokenHash = refreshTokenHash;
    await user.save();

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        fullName: user.fullName || null,
        email: user.email || null,
        avatar: user.avatar || null,
        isPhoneVerified: user.isPhoneVerified,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function refreshTokenHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw new AppError('VALIDATION_ERROR', 'Refresh token is required', 422);
    }

    let payload: { sub: string; phone: string; type: string };
    try {
      payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as typeof payload;
    } catch {
      throw new AppError('UNAUTHORIZED', 'Invalid or expired refresh token', 401);
    }

    if (payload.type !== 'refresh') {
      throw new AppError('UNAUTHORIZED', 'Invalid token type', 401);
    }

    const user = await User.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new AppError('UNAUTHORIZED', 'User not found or deactivated', 401);
    }

    if (user.refreshTokenHash) {
      const isValidStored = await bcrypt.compare(refreshToken, user.refreshTokenHash);
      if (!isValidStored) {
        throw new AppError('UNAUTHORIZED', 'Token reuse detected', 401);
      }
    }

    const newAccessToken = generateAccessToken({
      id: user._id,
      phoneNumber: user.phoneNumber,
      role: user.role,
      vendorId: user.vendorId,
    });

    const newRefreshToken = generateRefreshToken({
      id: user._id,
      phoneNumber: user.phoneNumber,
    });

    const refreshTokenHash = await bcrypt.hash(newRefreshToken, 10);
    user.refreshTokenHash = refreshTokenHash;
    await user.save();

    res.json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    next(err);
  }
}

export async function logoutHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user.sub, { refreshTokenHash: undefined });
    }

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}
