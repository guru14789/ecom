import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import firebaseConfig from './config';

let app: FirebaseApp;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

export { app };
export { getAuth } from 'firebase/auth';
export { getFirestore } from 'firebase/firestore';
