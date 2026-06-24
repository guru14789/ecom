import { Router } from 'express';
import { sendOtpHandler, verifyOtpHandler, refreshTokenHandler, logoutHandler } from '../controllers/authController';
import { authenticate } from '../middleware/authenticate';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { env } from '../config/env';
import { User } from '../models/User';
import { AppError } from '../utils/errors';
import { query } from '../config/postgres';

const router = Router();

router.post('/send-otp', sendOtpHandler);
router.post('/verify-otp', verifyOtpHandler);
router.post('/refresh', refreshTokenHandler);
router.post('/logout', authenticate, logoutHandler);

router.post('/vendor/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new AppError('VALIDATION_ERROR', 'Email and password are required', 422);
    }

    const user = await User.findOne({ email: email.toLowerCase(), role: { $in: ['vendor', 'vendor_admin'] } });
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Invalid credentials', 401);
    }

    // Verify password strictly
    if (!user.passwordHash) {
      throw new AppError('UNAUTHORIZED', 'Email login not configured for this vendor. Please login via OTP.', 401);
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new AppError('UNAUTHORIZED', 'Invalid credentials', 401);
    }

    const token = jwt.sign(
      { sub: user._id, phone: user.phoneNumber, role: user.role, vendorId: user.vendorId || user._id, type: 'access' },
      env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.fullName || 'Vendor',
        email: user.email,
        storeName: user.fullName || 'My Store',
        phone: user.phoneNumber,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/admin/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new AppError('VALIDATION_ERROR', 'Email and password are required', 422);
    }

    const user = await User.findOne({ email: email.toLowerCase(), role: { $in: ['platform_admin', 'super_admin'] } });
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Invalid credentials', 401);
    }

    // Verify password strictly
    if (!user.passwordHash) {
      throw new AppError('UNAUTHORIZED', 'Password not configured for this administrator.', 401);
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new AppError('UNAUTHORIZED', 'Invalid credentials', 401);
    }

    const token = jwt.sign(
      { sub: user._id, phone: user.phoneNumber, role: user.role, type: 'access' },
      env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.fullName || 'Admin',
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
