// Firebase connection test
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc } = require('firebase/firestore');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');

const config = {
  apiKey: 'AIzaSyAGXvMavBvpk4Fdg1ujB2r-MaxbIqZS0ak',
  authDomain: 'allergiai.firebaseapp.com',
  projectId: 'allergiai',
  storageBucket: 'allergiai.firebasestorage.app',
  messagingSenderId: '1052657724773',
  appId: '1:1052657724773:web:000923188a61de905f058c'
};

async function testFirebaseAuth() {
  try {
    console.log('🔥 Initializing Firebase...');
    const app = initializeApp(config);
    const db = getFirestore(app);
    const auth = getAuth(app);
    
    console.log('✅ Firebase initialized successfully');
    
    // Test user creation
    const testEmail = `test${Date.now()}@example.com`;
    const testPassword = 'testpass123';
    
    console.log('🔥 Creating test user:', testEmail);
    const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
    const user = userCredential.user;
    console.log('✅ User created:', user.uid);
    
    // Test Firestore write
    console.log('🔥 Creating user document in Firestore...');
    await setDoc(doc(db, 'users', user.uid), {
      name: 'Test User',
      email: testEmail,
      allergens: ['Peanuts'],
      createdAt: new Date().toISOString()
    });
    console.log('✅ User document created');
    
    // Test Firestore read
    console.log('🔥 Reading user document...');
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      console.log('✅ User document read:', userDoc.data());
    } else {
      console.log('❌ User document not found');
    }
    
    console.log('🎉 All Firebase tests passed!');
    
  } catch (error) {
    console.error('❌ Firebase test failed:', {
      code: error.code,
      message: error.message
    });
  }
}

testFirebaseAuth();