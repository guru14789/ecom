const admin = require('firebase-admin');
const serviceAccount = require('../../sree-projects-78f50-firebase-adminsdk-fbsvc-15fa30741d.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const email = 'sreekumar.lineofwork@gmail.com';

async function setAdmin() {
  try {
    let user;
    try {
      user = await admin.auth().getUserByEmail(email);
      console.log('Found user in Auth:', user.uid);
    } catch (e) {
      if (e.code === 'auth/user-not-found') {
        console.log('User not found in Auth. Creating...');
        user = await admin.auth().createUser({
          email,
          emailVerified: true
        });
        console.log('Created user in Auth:', user.uid);
      } else {
        throw e;
      }
    }

    const db = admin.firestore();
    const userRef = db.collection('users').doc(user.uid);
    const doc = await userRef.get();
    
    const adminData = {
      uid: user.uid,
      email: email,
      role: 'platform_admin',
      updatedAt: new Date().toISOString()
    };

    if (!doc.exists) {
       adminData.createdAt = new Date().toISOString();
       await userRef.set(adminData);
       console.log('Created admin user document in Firestore.');
    } else {
       await userRef.update(adminData);
       console.log('Updated existing user to platform_admin in Firestore.');
    }

    console.log('Successfully granted platform_admin to', email);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

setAdmin();
