import crypto from 'crypto';
import { env } from '../config/env';

// For production, ensure env.JWT_SECRET (or a dedicated ENCRYPTION_KEY) is 32 bytes (256 bits).
// We use a sha256 hash of the JWT_SECRET to guarantee a 32-byte key for AES-256.
const ALGORITHM = 'aes-256-gcm';
const KEY = crypto.createHash('sha256').update(env.JWT_SECRET).digest();

export function encrypt(text: string): { encryptedData: string; iv: string; authTag: string } {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  return {
    encryptedData: encrypted,
    iv: iv.toString('hex'),
    authTag,
  };
}

export function decrypt(encryptedData: string, ivHex: string, authTagHex: string): string {
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/** Utility to mask PAN (e.g. XXXXXX123X) */
export function maskPan(pan: string): string {
  if (!pan || pan.length < 10) return pan;
  return `XXXXXX${pan.substring(6, 9)}X`;
}

/** Utility to mask Account Number (e.g. XXXXXXXX1234) */
export function maskAccountNumber(acc: string): string {
  if (!acc || acc.length < 4) return acc;
  return acc.substring(0, acc.length - 4).replace(/./g, 'X') + acc.substring(acc.length - 4);
}
