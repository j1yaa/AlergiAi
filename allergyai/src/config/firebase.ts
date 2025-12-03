import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import '../utils/networkLogger'; // Import network logger to monitor Firebase requests
import { 
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
    FIREBASE_APP_ID
} from '@env';

const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID
};

// Debug config with detailed logging
console.log('🔥 Firebase config loaded:', {
  projectId: FIREBASE_PROJECT_ID,
  authDomain: FIREBASE_AUTH_DOMAIN,
  hasApiKey: !!FIREBASE_API_KEY,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID
});

let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  console.log('🔥 Firebase app initialized successfully');
} else {
  app = getApps()[0];
  console.log('🔥 Using existing Firebase app');
}

export const db = getFirestore(app);
console.log('🔥 Firestore initialized');

export const auth = getAuth(app);
console.log('🔥 Firebase Auth initialized');

// Log auth state changes
auth.onAuthStateChanged((user) => {
  if (user) {
    console.log('🔥 Auth state: User logged in', user.uid);
  } else {
    console.log('🔥 Auth state: User logged out');
  }
});

export default app;