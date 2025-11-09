import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyAGXvMavBvpk4Fdg1ujB2r-MaxbIqZS0ak",
  authDomain: "allergiai.firebaseapp.com",
  projectId: "allergiai",
  storageBucket: "allergiai.firebasestorage.app",
  messagingSenderId: "1052657724773",
  appId: "1:1052657724773:web:000923188a61de905f058c"
};

let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

export const db = getFirestore(app);

let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });
} catch {
  auth = getAuth(app);
}
export { auth };