import admin from 'firebase-admin';
import { db } from '../lib/firestore/client';
import { getUserByEmail, updateUser } from '../lib/firestore/users';
import { createVendor } from '../lib/firestore/vendors';

const email = 'sreekumar.career@gmail.com';

async function assignVendorAccess() {
  console.log(`Checking user account for email: ${email}`);
  const user = await getUserByEmail(email);

  if (!user) {
    console.log(`User not found with email ${email}. Making a dummy vendor user profile first...`);
    const mockUid = `usr_${Date.now()}`;
    
    // Create new vendor profile
    const vendor = await createVendor({
      userId: mockUid,
      storeName: 'Sree Career Store',
      businessName: 'Sree Career Enterprise',
      email,
      phoneNumber: '9999999999',
      registrationStatus: 'approved',
      onboardingStep: 6,
      kycStatus: 'verified',
      isOpen: true,
      verified: true,
      isActive: true,
      rating: 5,
      totalOrders: 0,
      totalRevenue: 0,
      bankDetails: {
        upiId: 'sree@upi'
      }
    });

    const ref = db.collection('users').doc(mockUid);
    await ref.set({
      firebaseUid: mockUid,
      phoneNumber: '9999999999',
      email,
      fullName: 'Sreekumar Vendor',
      role: 'vendor',
      vendorId: vendor.id,
      isPhoneVerified: true,
      isEmailVerified: true,
      addresses: [],
      walletBalance: 0,
      walletTransactions: [],
      referralCode: 'SREEVEND',
      referredCount: 0,
      isActive: true,
      preferences: {
        language: 'en',
        currency: 'INR',
        notifications: { email: true, sms: true, push: true }
      },
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now()
    });

    console.log(`Successfully created vendor user & associated vendor document ID: ${vendor.id}`);
    return;
  }

  console.log(`User found with ID: ${user.id}`);
  let vendorId = user.vendorId;

  if (!vendorId) {
    console.log('No associated vendor profile found. Creating one...');
    const vendor = await createVendor({
      userId: user.id,
      storeName: 'Sree Career Store',
      businessName: 'Sree Career Enterprise',
      email,
      phoneNumber: user.phoneNumber || '9999999999',
      registrationStatus: 'approved',
      onboardingStep: 6,
      kycStatus: 'verified',
      isOpen: true,
      verified: true,
      isActive: true,
      rating: 5,
      totalOrders: 0,
      totalRevenue: 0,
      bankDetails: {
        upiId: 'sree@upi'
      }
    });
    vendorId = vendor.id;
  }

  console.log(`Assigning role: vendor and vendorId: ${vendorId} to user: ${user.id}`);
  await updateUser(user.id, {
    role: 'vendor',
    vendorId: vendorId
  });

  console.log('User permissions updated successfully!');
}

assignVendorAccess().catch(err => {
  console.error('Error updating user access:', err);
});
