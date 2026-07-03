/**
 * One-shot migration script: MongoDB → Firestore
 *
 * Usage:
 *   FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json \
 *   MONGODB_URI=mongodb://localhost:27017/shopsyy_dev \
 *   npx ts-node src/scripts/migrate-to-firestore.ts
 */

import admin from 'firebase-admin';
import { MongoClient } from 'mongodb';
import path from 'path';

// ─── Init Firebase ─────────────────────────────────────────────────────────
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './serviceAccountKey.json';
admin.initializeApp({
  credential: admin.credential.cert(require(path.resolve(serviceAccountPath))),
});
const db = admin.firestore();

// ─── Helpers ──────────────────────────────────────────────────────────────
const BATCH_SIZE = 400;

async function batchWrite(
  collection: string,
  docs: { id: string; data: Record<string, unknown> }[]
): Promise<void> {
  let batch = db.batch();
  let count = 0;

  for (const doc of docs) {
    const ref = db.collection(collection).doc(doc.id);
    batch.set(ref, doc.data, { merge: true });
    count++;

    if (count >= BATCH_SIZE) {
      await batch.commit();
      console.log(`  Committed batch of ${count} docs to /${collection}`);
      batch = db.batch();
      count = 0;
    }
  }

  if (count > 0) {
    await batch.commit();
    console.log(`  Committed final batch of ${count} docs to /${collection}`);
  }
}

function toTimestamp(date: Date | string | undefined): admin.firestore.Timestamp | null {
  if (!date) return null;
  return admin.firestore.Timestamp.fromDate(new Date(date));
}

// ─── Collection Migrators ─────────────────────────────────────────────────

async function migrateUsers(mongoDb: any) {
  console.log('\n[1/9] Migrating users...');
  const cursor = mongoDb.collection('users').find({});
  const docs: { id: string; data: Record<string, unknown> }[] = [];

  for await (const doc of cursor) {
    docs.push({
      id: doc._id.toString(),
      data: {
        firebaseUid: doc.firebaseUid || doc._id.toString(),
        phoneNumber: doc.phoneNumber || '',
        email: doc.email || null,
        fullName: doc.fullName || null,
        avatar: doc.avatar || null,
        role: doc.role || 'buyer',
        vendorId: doc.vendorId || null,
        isPhoneVerified: doc.isPhoneVerified ?? false,
        isEmailVerified: doc.isEmailVerified ?? false,
        addresses: doc.addresses || [],
        walletBalance: doc.walletBalance || 0,
        walletTransactions: (doc.walletTransactions || []).map((t: any) => ({
          ...t,
          createdAt: toTimestamp(t.createdAt),
        })),
        referralCode: doc.referralCode || doc._id.toString().slice(0, 8).toUpperCase(),
        referredBy: doc.referredBy || null,
        referredCount: doc.referredCount || 0,
        preferences: doc.preferences || {
          language: 'en',
          currency: 'INR',
          notifications: { email: true, sms: true, push: true },
        },
        isActive: doc.isActive ?? true,
        lastLoginAt: toTimestamp(doc.lastLoginAt),
        createdAt: toTimestamp(doc.createdAt) || admin.firestore.Timestamp.now(),
        updatedAt: toTimestamp(doc.updatedAt) || admin.firestore.Timestamp.now(),
      },
    });
  }

  await batchWrite('users', docs);
  console.log(`  ✓ ${docs.length} users migrated`);
}

async function migrateVendors(mongoDb: any) {
  console.log('\n[2/9] Migrating vendors...');
  const cursor = mongoDb.collection('vendors').find({});
  const docs: { id: string; data: Record<string, unknown> }[] = [];

  for await (const doc of cursor) {
    docs.push({
      id: doc._id.toString(),
      data: {
        userId: doc.userId || '',
        storeName: doc.storeName || '',
        businessName: doc.businessName || doc.storeName || '',
        email: doc.email || '',
        phoneNumber: doc.phoneNumber || '',
        gstin: doc.gstin || null,
        pan: doc.pan || null,
        bankDetails: doc.bankDetails || {},
        kycStatus: doc.kycStatus || (doc.kycVerified ? 'verified' : 'pending'),
        kycDocuments: doc.kycDocuments || {},
        verified: doc.verified ?? false,
        isActive: doc.isActive ?? true,
        rating: doc.rating || 0,
        totalOrders: doc.totalOrders || 0,
        totalRevenue: doc.totalRevenue || 0,
        logo: doc.logo || null,
        banner: doc.banner || null,
        description: doc.description || null,
        address: doc.address || null,
        deliveryRadiusKm: doc.deliveryRadiusKm || null,
        minOrderValue: doc.minOrderValue || null,
        isOpen: doc.isOpen ?? true,
        operatingHours: doc.operatingHours || null,
        createdAt: toTimestamp(doc.createdAt) || admin.firestore.Timestamp.now(),
        updatedAt: toTimestamp(doc.updatedAt) || admin.firestore.Timestamp.now(),
      },
    });
  }

  await batchWrite('vendors', docs);
  console.log(`  ✓ ${docs.length} vendors migrated`);
}

async function migrateProducts(mongoDb: any) {
  console.log('\n[3/9] Migrating products...');
  const cursor = mongoDb.collection('products').find({});
  const docs: { id: string; data: Record<string, unknown> }[] = [];

  for await (const doc of cursor) {
    docs.push({
      id: doc._id.toString(),
      data: {
        name: doc.name,
        description: doc.description || null,
        slug: doc.slug || doc._id.toString(),
        category: doc.category || '',
        subcategory: doc.subcategory || null,
        brand: doc.brand || null,
        tags: doc.tags || [],
        price: doc.price || 0,
        groupPrice: doc.groupPrice || doc.price || 0,
        mrp: doc.mrp || null,
        targetCount: doc.targetCount || 0,
        image: doc.image || '',
        images: doc.images || [],
        specs: doc.specs || [],
        highlights: doc.highlights || [],
        variants: doc.variants || [],
        vendorId: doc.vendorId || '',
        stock: doc.stock || 0,
        returnPolicy: doc.returnPolicy || null,
        warranty: doc.warranty || null,
        deliveryTime: doc.deliveryTime || null,
        rating: doc.rating || 0,
        reviews: doc.reviews || 0,
        badge: doc.badge || null,
        sponsored: doc.sponsored ?? false,
        isActive: doc.isActive ?? true,
        isFeatured: doc.isFeatured ?? false,
        createdAt: toTimestamp(doc.createdAt) || admin.firestore.Timestamp.now(),
        updatedAt: toTimestamp(doc.updatedAt) || admin.firestore.Timestamp.now(),
      },
    });
  }

  await batchWrite('products', docs);
  console.log(`  ✓ ${docs.length} products migrated`);
}

async function migrateOrders(mongoDb: any) {
  console.log('\n[4/9] Migrating orders...');
  const cursor = mongoDb.collection('orders').find({});
  const docs: { id: string; data: Record<string, unknown> }[] = [];

  for await (const doc of cursor) {
    docs.push({
      id: doc._id.toString(),
      data: {
        userId: doc.userId || '',
        items: doc.items || [],
        deliveryAddress: doc.deliveryAddress || {},
        subtotal: doc.subtotal || 0,
        discount: doc.discount || 0,
        couponDiscount: doc.couponDiscount || 0,
        couponCode: doc.couponCode || null,
        handlingFee: doc.handlingFee || 0,
        deliveryFee: doc.deliveryFee || 0,
        total: doc.total || 0,
        paymentMethod: doc.paymentMethod || 'cod',
        paymentStatus: doc.paymentStatus || 'pending',
        paymentReference: doc.paymentReference || null,
        razorpayOrderId: doc.razorpayOrderId || null,
        razorpayPaymentId: doc.paymentReference || null,
        paidAt: toTimestamp(doc.paidAt),
        status: doc.status || 'pending',
        timeline: (doc.timeline || []).map((t: any) => ({
          ...t,
          timestamp: toTimestamp(t.timestamp),
        })),
        trackingId: doc.trackingId || null,
        estimatedDelivery: toTimestamp(doc.estimatedDelivery),
        deliveredAt: toTimestamp(doc.deliveredAt),
        groupSessionId: doc.groupSessionId || null,
        vendorOrders: doc.vendorOrders || [],
        createdAt: toTimestamp(doc.createdAt) || admin.firestore.Timestamp.now(),
        updatedAt: toTimestamp(doc.updatedAt) || admin.firestore.Timestamp.now(),
      },
    });
  }

  await batchWrite('orders', docs);
  console.log(`  ✓ ${docs.length} orders migrated`);
}

async function migrateCollection(mongoDb: any, mongoName: string, fsName: string, transform?: (doc: any) => Record<string, unknown>) {
  console.log(`\nMigrating ${mongoName} → ${fsName}...`);
  const cursor = mongoDb.collection(mongoName).find({});
  const docs: { id: string; data: Record<string, unknown> }[] = [];

  for await (const doc of cursor) {
    const { _id, __v, ...rest } = doc;
    const data = transform ? transform(rest) : rest;
    // Convert any Date objects
    Object.keys(data).forEach((k) => {
      if (data[k] instanceof Date) {
        (data as any)[k] = admin.firestore.Timestamp.fromDate(data[k] as Date);
      }
    });
    docs.push({ id: _id.toString(), data: { ...data, id: _id.toString() } });
  }

  if (docs.length > 0) {
    await batchWrite(fsName, docs);
  }
  console.log(`  ✓ ${docs.length} docs migrated`);
}

// ─── Main ──────────────────────────────────────────────────────────────────
async function main() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/shopsyy_dev';
  const mongoClient = new MongoClient(mongoUri);

  try {
    await mongoClient.connect();
    const mongoDb = mongoClient.db();
    console.log('✓ Connected to MongoDB:', mongoUri);
    console.log('✓ Connected to Firestore\n');
    console.log('Starting migration...\n');

    await migrateUsers(mongoDb);
    await migrateVendors(mongoDb);
    await migrateProducts(mongoDb);
    await migrateOrders(mongoDb);

    // Simpler collections
    await migrateCollection(mongoDb, 'categories', 'categories');
    await migrateCollection(mongoDb, 'reviews', 'reviews');
    await migrateCollection(mongoDb, 'coupons', 'coupons');
    await migrateCollection(mongoDb, 'groupsessions', 'group_sessions');
    await migrateCollection(mongoDb, 'returnrequests', 'return_requests');

    console.log('\n✅ Migration complete!');
    console.log('\nNext steps:');
    console.log('  1. Verify data in Firebase Console: https://console.firebase.google.com');
    console.log('  2. Update your .env with Firebase credentials');
    console.log('  3. Deploy: firebase deploy');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await mongoClient.close();
    process.exit(0);
  }
}

main();
