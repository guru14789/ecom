import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  createVendor,
  getVendorByUserId,
  getVendorById,
  updateVendor,
  updateVendorRegistrationStatus,
  Vendor,
} from '../../lib/firestore/vendors';
import { getUserByFirebaseUid, updateUser } from '../../lib/firestore/users';
import { auth } from '../../lib/firestore/client';
import { generateUploadUrl } from '../../services/cloudflare-r2';
import { ValidationError, NotFoundError, AppError } from '../../utils/errors';

const router = Router();

// ─── Helper: verify Firebase token and return uid (optional auth) ──────────────
async function getUidFromHeader(req: Request): Promise<string | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    console.error('getUidFromHeader: No Bearer token found in headers');
    return null;
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = await auth.verifyIdToken(token);
    return decoded.uid;
  } catch (err: any) {
    console.error('Firebase verifyIdToken error:', err.message, err.code);
    throw new AppError('UNAUTHORIZED', `Firebase Auth Error: ${err.message}`, 401);
  }
}

// ─── Step 1: Initiate registration (creates draft vendor) ─────────────────────
// POST /api/public/vendor/register/initiate
const initiateSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email().optional().or(z.literal('')),
  phoneNumber: z.string().min(10).optional().or(z.literal('')),
  businessName: z.string().min(2),
  storeName: z.string().min(2),
  storeSlug: z.string().min(3).regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, hyphens'),
});

router.post('/initiate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = initiateSchema.safeParse(req.body);
    if (!parsed.success) throw new ValidationError('Invalid registration data', parsed.error.issues);

    const uid = await getUidFromHeader(req);
    if (!uid) throw new AppError('UNAUTHORIZED', 'Firebase authentication required', 401);

    const user = await getUserByFirebaseUid(uid);
    if (!user) throw new NotFoundError('User account not found');

    // Check if vendor already exists for this user
    const existing = await getVendorByUserId(user.id);
    if (existing) {
      return res.json({ success: true, data: { vendorId: existing.id, registrationStatus: existing.registrationStatus, onboardingStep: existing.onboardingStep } });
    }

    const { fullName, email, phoneNumber, businessName, storeName, storeSlug } = parsed.data;

    const vendor = await createVendor({
      userId: user.id,
      storeName,
      businessName,
      email,
      phoneNumber,
      storeSlug,
      registrationStatus: 'draft',
      onboardingStep: 1,
      kycStatus: 'pending',
      bankDetails: {},
      isOpen: false,
      verified: false,
      isActive: false,
      rating: 0,
      totalOrders: 0,
      totalRevenue: 0,
      followers: 0,
    } as Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'>);

    // Link vendor to user
    await updateUser(user.id, { role: 'vendor', vendorId: vendor.id });

    res.status(201).json({ success: true, data: { vendorId: vendor.id, registrationStatus: 'draft', onboardingStep: 1 } });
  } catch (err) { next(err); }
});

// ─── Step 2: Business & Tax Details ──────────────────────────────────────────
// PUT /api/public/vendor/register/:vendorId/business
const businessSchema = z.object({
  businessName: z.string().min(2),
  gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN').optional().or(z.literal('')),
  pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN').optional().or(z.literal('')),
  vatNumber: z.string().optional(),
});

import { encrypt } from '../../utils/encryption';

router.put('/:vendorId/business', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const uid = await getUidFromHeader(req);
    if (!uid) throw new AppError('UNAUTHORIZED', 'Firebase authentication required', 401);

    const vendor = await getVendorById(req.params.vendorId);
    if (!vendor) throw new NotFoundError('Vendor not found');

    const parsed = businessSchema.safeParse(req.body);
    if (!parsed.success) throw new ValidationError('Invalid business data', parsed.error.issues);

    const payload: any = { ...parsed.data, onboardingStep: Math.max(vendor.onboardingStep, 2) };
    
    // Encrypt PAN if provided
    if (parsed.data.pan) {
      const encryptedPan = encrypt(parsed.data.pan);
      payload.pan = `${encryptedPan.iv}:${encryptedPan.authTag}:${encryptedPan.encryptedData}`;
    }

    await updateVendor(vendor.id, payload);
    res.json({ success: true, onboardingStep: 2 });
  } catch (err) { next(err); }
});

// ─── Step 3: Store Identity (logo, banner, description) ──────────────────────
// PUT /api/public/vendor/register/:vendorId/store
const storeSchema = z.object({
  storeName: z.string().min(2),
  storeSlug: z.string().min(3).regex(/^[a-z0-9-]+$/),
  description: z.string().max(1000).optional(),
  logo: z.string().url().optional().or(z.literal('')),
  banner: z.string().url().optional().or(z.literal('')),
  approvedCategories: z.array(z.string()).optional(),
});

router.put('/:vendorId/store', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const uid = await getUidFromHeader(req);
    if (!uid) throw new AppError('UNAUTHORIZED', 'Firebase authentication required', 401);

    const vendor = await getVendorById(req.params.vendorId);
    if (!vendor) throw new NotFoundError('Vendor not found');

    const user = await getUserByFirebaseUid(uid);
    if (!user || vendor.userId !== user.id) throw new AppError('FORBIDDEN', 'Access denied', 403);

    const parsed = storeSchema.safeParse(req.body);
    if (!parsed.success) throw new ValidationError('Invalid store data', parsed.error.issues);

    await updateVendor(vendor.id, { ...parsed.data, onboardingStep: Math.max(vendor.onboardingStep, 3) });
    res.json({ success: true, onboardingStep: 3 });
  } catch (err) { next(err); }
});

// ─── Step 4: Addresses ────────────────────────────────────────────────────────
// PUT /api/public/vendor/register/:vendorId/addresses
const addressSchema = z.object({
  line1: z.string().min(5),
  line2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().regex(/^\d{6}$/, 'Invalid pincode'),
  country: z.string().optional(),
});

const addressesSchema = z.object({
  address: addressSchema,
  pickupAddress: addressSchema.optional(),
  returnAddress: addressSchema.optional(),
  warehouseAddress: addressSchema.optional(),
});

router.put('/:vendorId/addresses', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const uid = await getUidFromHeader(req);
    if (!uid) throw new AppError('UNAUTHORIZED', 'Firebase authentication required', 401);

    const vendor = await getVendorById(req.params.vendorId);
    if (!vendor) throw new NotFoundError('Vendor not found');

    const user = await getUserByFirebaseUid(uid);
    if (!user || vendor.userId !== user.id) throw new AppError('FORBIDDEN', 'Access denied', 403);

    const parsed = addressesSchema.safeParse(req.body);
    if (!parsed.success) throw new ValidationError('Invalid address data', parsed.error.issues);

    await updateVendor(vendor.id, { ...parsed.data, onboardingStep: Math.max(vendor.onboardingStep, 4) });
    res.json({ success: true, onboardingStep: 4 });
  } catch (err) { next(err); }
});

// ─── Step 5: Bank Details ─────────────────────────────────────────────────────
// PUT /api/public/vendor/register/:vendorId/bank
const bankSchema = z.object({
  accountNo: z.string().min(9).max(18),
  ifsc: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code'),
  beneficiaryName: z.string().min(2),
  upiId: z.string().optional(),
});

router.put('/:vendorId/bank', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const uid = await getUidFromHeader(req);
    if (!uid) throw new AppError('UNAUTHORIZED', 'Firebase authentication required', 401);

    const vendor = await getVendorById(req.params.vendorId);
    if (!vendor) throw new NotFoundError('Vendor not found');

    const user = await getUserByFirebaseUid(uid);
    if (!user || vendor.userId !== user.id) throw new AppError('FORBIDDEN', 'Access denied', 403);

    const parsed = bankSchema.safeParse(req.body);
    if (!parsed.success) throw new ValidationError('Invalid bank details', parsed.error.issues);

    await updateVendor(vendor.id, { bankDetails: parsed.data, onboardingStep: Math.max(vendor.onboardingStep, 5) });
    res.json({ success: true, onboardingStep: 5 });
  } catch (err) { next(err); }
});

import { verifyGst, verifyPan, verifyBankAccount, verifyDigilocker } from '../../services/verification.service';
import { encrypt } from '../../utils/encryption';

// ─── Verification Endpoints ───────────────────────────────────────────────────

// POST /api/public/vendor/register/verify/gst
router.post('/verify/gst', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const uid = await getUidFromHeader(req);
    if (!uid) throw new AppError('UNAUTHORIZED', 'Firebase authentication required', 401);
    
    const { gstin } = req.body;
    if (!gstin) throw new ValidationError('GSTIN required');

    const result = await verifyGst(gstin);
    if (!result.valid) throw new AppError('BAD_REQUEST', 'Invalid GSTIN', 400);

    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// POST /api/public/vendor/register/verify/pan
router.post('/verify/pan', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const uid = await getUidFromHeader(req);
    if (!uid) throw new AppError('UNAUTHORIZED', 'Firebase authentication required', 401);

    const { pan, name } = req.body;
    if (!pan) throw new ValidationError('PAN required');

    const result = await verifyPan(pan, name);
    if (!result.valid) throw new AppError('BAD_REQUEST', 'Invalid PAN', 400);

    // Encrypt PAN before returning/storing if needed, but since we are just verifying,
    // the frontend will pass it to the /initiate or /submit endpoint which will then store it.
    // Wait, the frontend needs to pass the encrypted PAN? No, the frontend passes raw PAN to /initiate,
    // and the backend should encrypt it during /initiate or /submit.
    // We will encrypt it here and return the securedPan to the frontend to hold in state, OR
    // just let the submit endpoint handle encryption. Let's let the backend handle it later.

    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// POST /api/public/vendor/register/:vendorId/verify/bank
router.post('/:vendorId/verify/bank', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const uid = await getUidFromHeader(req);
    if (!uid) throw new AppError('UNAUTHORIZED', 'Firebase authentication required', 401);
    const vendor = await getVendorById(req.params.vendorId);
    if (!vendor) throw new NotFoundError('Vendor not found');

    // We assume bank details are already saved from step 5.
    if (!vendor.bankDetails?.accountNo || !vendor.bankDetails?.ifsc) {
      throw new AppError('BAD_REQUEST', 'Bank details not provided yet', 400);
    }

    const result = await verifyBankAccount(vendor.bankDetails.accountNo, vendor.bankDetails.ifsc);
    if (!result.valid) throw new AppError('BAD_REQUEST', 'Bank Penny Drop failed', 400);

    await updateVendor(vendor.id, { 
      bankVerified: true,
      accountHolderName: result.accountHolderName
    });
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// ─── Submit Registration ──────────────────────────────────────────────────────
router.post('/:vendorId/submit', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const uid = await getUidFromHeader(req);
    if (!uid) throw new AppError('UNAUTHORIZED', 'Firebase authentication required', 401);

    const vendor = await getVendorById(req.params.vendorId);
    if (!vendor) throw new NotFoundError('Vendor not found');

    if (vendor.onboardingStep < 5) {
      throw new AppError('INCOMPLETE', 'Please complete all onboarding steps before submitting', 400);
    }

    // Calculate Trust Score
    let trustScore = 0;
    const { mobileVerified, gstVerified, panVerified, bankVerified, digilockerVerified } = req.body;
    
    if (mobileVerified) trustScore += 20;
    if (gstVerified || vendor.gstVerified) trustScore += 30;
    if (panVerified || vendor.panVerified) trustScore += 20;
    if (bankVerified || vendor.bankVerified) trustScore += 20;
    if (digilockerVerified || vendor.digilockerVerified) trustScore += 10;

    let registrationStatus: RegistrationStatus = 'pending';
    let message = 'Registration submitted for manual review';

    if (trustScore >= 80) {
      registrationStatus = 'approved';
      message = 'Registration automatically approved!';
    } else if (trustScore >= 50) {
      registrationStatus = 'under_review';
      message = 'Registration submitted with limited access.';
    }

    const updatePayload = {
      mobileVerified: !!mobileVerified,
      digilockerVerified: !!digilockerVerified,
      trustScore,
      onboardingStep: 6,
    };

    await updateVendor(vendor.id, updatePayload);
    await updateVendorRegistrationStatus(vendor.id, registrationStatus, { 
      approvedBy: registrationStatus === 'approved' ? 'AUTO_VERIFIER' : undefined 
    });

    res.json({ success: true, message, registrationStatus, trustScore });
  } catch (err) { next(err); }
});

// ─── GET: Registration status ─────────────────────────────────────────────────
// GET /api/public/vendor/register/status
router.get('/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const uid = await getUidFromHeader(req);
    if (!uid) throw new AppError('UNAUTHORIZED', 'Firebase authentication required', 401);

    const user = await getUserByFirebaseUid(uid);
    if (!user) throw new NotFoundError('User not found');

    const vendor = user.vendorId ? await getVendorById(user.vendorId) : await getVendorByUserId(user.id);
    if (!vendor) return res.json({ data: null });

    res.json({
      data: {
        vendorId: vendor.id,
        registrationStatus: vendor.registrationStatus,
        onboardingStep: vendor.onboardingStep,
        rejectionReason: vendor.rejectionReason,
        storeName: vendor.storeName,
        storeSlug: vendor.storeSlug,
      },
    });
  } catch (err) { next(err); }
});

export default router;
