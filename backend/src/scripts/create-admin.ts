import '../config/env';
import { auth, db } from '../lib/firestore/client';

async function createAdmin() {
  const email = 'sreekumar.career@gmail.com';
  const password = 'sree123'; // Firebase requires min 6 chars

  try {
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
      console.log('User already exists in Firebase Auth. Updating password...');
      await auth.updateUser(userRecord.uid, { password });
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') {
        userRecord = await auth.createUser({
          email,
          password,
          displayName: 'Super Admin',
        });
        console.log('Created user in Firebase Auth.');
      } else {
        throw e;
      }
    }

    // Set custom claims (optional, but good for security rules)
    await auth.setCustomUserClaims(userRecord.uid, { admin: true, vendor: true });

    // Create or update Firestore user document
    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      displayName: 'Super Admin',
      role: 'super_admin', // Access to admin panel and vendor panel
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    console.log(`Successfully configured user ${email} as super_admin.`);
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();
