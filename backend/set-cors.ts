import admin from 'firebase-admin';

// Load credentials
const serviceAccountPath = '/Users/sureshkumar/shopsyy/sree-projects-78f50-firebase-adminsdk-fbsvc-15fa30741d.json';
const credential = admin.credential.cert(require(serviceAccountPath));

admin.initializeApp({
  credential,
  storageBucket: 'sree-projects-78f50.firebasestorage.app'
});

async function setCors() {
  const bucket = admin.storage().bucket();
  const corsConfig = [
    {
      origin: ['*'],
      method: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      responseHeader: ['Content-Type', 'Authorization', 'Content-Length', 'User-Agent', 'x-goog-resumable'],
      maxAgeSeconds: 3600
    }
  ];

  try {
    console.log(`Setting CORS on bucket ${bucket.name}...`);
    await bucket.setCorsConfiguration(corsConfig);
    console.log('CORS configured successfully!');
  } catch (err) {
    console.error('Failed to set CORS:', err);
  }
}

setCors();
