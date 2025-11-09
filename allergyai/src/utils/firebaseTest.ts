import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export const testFirebaseAuth = async () => {
  try {
    console.log('Testing Firebase Auth...');
    const testEmail = `test${Date.now()}@example.com`;
    const testPassword = 'testpassword123';
    
    // Test user creation
    const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
    console.log('✅ User created:', userCredential.user.uid);
    
    // Test login
    await signInWithEmailAndPassword(auth, testEmail, testPassword);
    console.log('✅ Login successful');
    
    return { success: true, message: 'Firebase Auth working!' };
  } catch (error: any) {
    console.error('❌ Firebase Auth failed:', error.message);
    return { success: false, message: error.message };
  }
};

export const testFirestore = async () => {
  try {
    console.log('Testing Firestore...');
    
    // Test write
    const docRef = await addDoc(collection(db, 'test'), {
      message: 'Hello Firebase!',
      timestamp: new Date().toISOString()
    });
    console.log('✅ Document written with ID:', docRef.id);
    
    // Test read
    const querySnapshot = await getDocs(collection(db, 'test'));
    console.log('✅ Documents read:', querySnapshot.size);
    
    return { success: true, message: 'Firestore working!' };
  } catch (error: any) {
    console.error('❌ Firestore failed:', error.message);
    return { success: false, message: error.message };
  }
};