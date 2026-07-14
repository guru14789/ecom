import { config } from 'dotenv';
import path from 'path';
config({ path: path.resolve(__dirname, '../.env') });

import { db, auth } from '../src/lib/firestore/client';
import { getAuth } from 'firebase-admin/auth';
import { Timestamp } from 'firebase-admin/firestore';

async function grantVendorAccess() {
  const email = 'sreekumar.career@gmail.com';
  console.log(`Looking for user with email: ${email}`);

  try {
    // 1. Try to find user in Firebase Auth
    let firebaseUid;
    try {
      const userRecord = await getAuth().getUserByEmail(email);
      firebaseUid = userRecord.uid;
      console.log(`Found Firebase user: ${firebaseUid}`);
    } catch (e) {
      console.log(`User not found in Firebase Auth (or admin SDK error): ${e}`);
      firebaseUid = `mock-uid-${Date.now()}`;
      console.log(`Using mock firebaseUid: ${firebaseUid}`);
    }

    // 2. Find user in Firestore 'users' collection
    const usersSnapshot = await db.collection('users').where('email', '==', email).get();
    let firestoreUserId = null;
    let userDocRef = null;

    if (usersSnapshot.empty) {
      console.log('User not found in Firestore. Creating user doc...');
      userDocRef = db.collection('users').doc();
      firestoreUserId = userDocRef.id;
      await userDocRef.set({
        firebaseUid: firebaseUid,
        email: email,
        displayName: 'Sree Kumar',
        role: 'vendor',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    } else {
      userDocRef = usersSnapshot.docs[0].ref;
      firestoreUserId = userDocRef.id;
      console.log(`Found Firestore user: ${firestoreUserId}`);
    }

    // 3. Check if vendor already exists
    const vendorSnapshot = await db.collection('vendors').where('userId', '==', firestoreUserId).get();
    let vendorId = null;

    if (!vendorSnapshot.empty) {
      console.log('Vendor profile already exists for this user.');
      vendorId = vendorSnapshot.docs[0].id;
      // Approve it
      await vendorSnapshot.docs[0].ref.update({
        registrationStatus: 'approved',
        isActive: true,
        trustScore: 100,
        approvedAt: Timestamp.now(),
        approvedBy: 'SYSTEM_ADMIN',
        onboardingStep: 6
      });
      console.log(`Vendor ${vendorId} approved.`);
    } else {
      // Create new vendor profile
      console.log('Creating new vendor profile...');
      const vendorRef = db.collection('vendors').doc();
      vendorId = vendorRef.id;
      await vendorRef.set({
        userId: firestoreUserId,
        businessName: 'Default Vendor Business',
        storeName: 'Sree Store',
        storeSlug: 'sree-store',
        registrationStatus: 'approved',
        isActive: true,
        trustScore: 100,
        mobileVerified: true,
        gstVerified: true,
        panVerified: true,
        bankVerified: true,
        digilockerVerified: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        onboardingStep: 6
      });
      console.log(`Created Vendor ID: ${vendorId}`);
    }

    // 4. Link vendor to user
    await userDocRef.update({
      role: 'vendor',
      vendorId: vendorId,
      updatedAt: Timestamp.now(),
    });
    console.log('Successfully linked vendor profile to user.');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

grantVendorAccess();
