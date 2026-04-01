import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, Firestore } from 'firebase/firestore';
import { initializeAuth, getAuth, Auth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import '../utils/networkLogger';

const firebaseConfig = {
  apiKey: 'AIzaSyAGXvMavBvpk4Fdg1ujB2r-MaxbIqZS0ak',
  authDomain: 'allergiai.firebaseapp.com',
  projectId: 'allergiai',
  storageBucket: 'allergiai.firebasestorage.app',
  messagingSenderId: '1052657724773',
  appId: '1:1052657724773:web:000923188a61de905f058c'
};

let app: FirebaseApp;
let auth: Auth;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  console.log('Firebase app initialized');
  
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
    console.log('Auth initialized with persistence');
  } catch (error) {
    console.log('Auth already initialized, using existing');
    auth = getAuth(app);
  }
} else {
  app = getApps()[0];
  auth = getAuth(app);
  console.log('Using existing Firebase app');
}

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});
export { auth };

// Log auth state changes
auth.onAuthStateChanged((user) => {
  if (user) {
    console.log('Auth state: User logged in', user.uid);
  } else {
    console.log('Auth state: User logged out');
  }
});

export default app;