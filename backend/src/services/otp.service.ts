import bcrypt from 'bcryptjs';
import { OtpRecord } from '../models/OtpRecord';
import { smsService } from './sms.service';

const OTP_LENGTH = 6;
const MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const MAX_OTP_PER_WINDOW = 3;

function generateOTP(): string {
  let otp = '';
  for (let i = 0; i < OTP_LENGTH; i++) {
    otp += Math.floor(Math.random() * 10).toString();
  }
  return otp;
}

export async function sendOtp(phoneNumber: string): Promise<void> {
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
  const recentCount = await OtpRecord.countDocuments({
    phoneNumber,
    createdAt: { $gte: since },
  });

  if (recentCount >= MAX_OTP_PER_WINDOW) {
    throw new Error('Rate limit exceeded. Maximum 3 OTPs per 10 minutes.');
  }

  const otp = generateOTP();
  const hashedOtp = await bcrypt.hash(otp, 10);

  await OtpRecord.create({
    phoneNumber,
    otp: hashedOtp,
    attempts: 0,
  });

  await smsService.sendOTP(phoneNumber, otp);
}

export async function verifyOtp(phoneNumber: string, otpInput: string): Promise<boolean> {
  const records = await OtpRecord.find({ phoneNumber })
    .sort({ createdAt: -1 })
    .limit(1);

  if (records.length === 0) {
    throw new Error('No OTP found. Please request a new OTP.');
  }

  const record = records[0];

  if (record.attempts >= MAX_ATTEMPTS) {
    throw new Error('Maximum attempts exceeded. Please request a new OTP.');
  }

  record.attempts += 1;
  await record.save();

  const isValid = await bcrypt.compare(otpInput, record.otp);
  if (!isValid) {
    return false;
  }

  await OtpRecord.deleteMany({ phoneNumber });

  return true;
}
