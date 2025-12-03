import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, where, orderBy, limit, startAfter, doc, getDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { Symptom } from './types';

// Initialize Firebase (use same config as client)
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export const createUser = async (name: string, email: string, password: string, allergens: string[]) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  
  const userData = {
    id: user.uid,
    name,
    email,
    allergens,
    createdAt: new Date()
  };
  
  await addDoc(collection(db, 'users'), userData);
  return userData;
};

export const findUserByEmail = async (email: string) => {
  const q = query(collection(db, 'users'), where('email', '==', email));
  const querySnapshot = await getDocs(q);
  return querySnapshot.empty ? null : querySnapshot.docs[0].data();
};

export const validateUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return await findUserByEmail(email);
  } catch (error) {
    return null;
  }
};

export const createMeal = async (userId: string, description: string, analysis: any) => {
  const mealData = {
    userId,
    description,
    ingredients: analysis.ingredients,
    allergens: analysis.allergens,
    riskScore: analysis.riskScore,
    createdAt: new Date()
  };
  
  const docRef = await addDoc(collection(db, 'meals'), mealData);
  return { id: docRef.id, ...mealData };
};

export const createAlert = async (userId: string, mealId: string, severity: string, allergens: string[], note: string) => {
  const alertData = {
    userId,
    mealId,
    severity,
    allergens,
    note,
    createdAt: new Date()
  };
  
  const docRef = await addDoc(collection(db, 'alerts'), alertData);
  return { id: docRef.id, ...alertData };
};

export const getUserMeals = async (userId: string) => {
  const q = query(
    collection(db, 'meals'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getUserAlerts = async (userId: string, status: string, page: number, pageSize: number) => {
  const q = query(
    collection(db, 'alerts'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(pageSize)
  );
  const querySnapshot = await getDocs(q);
  const alerts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return { alerts, total: alerts.length };
};

export const getSymptoms = async (userId: string, page: number, pageSize: number) => {
  const q = query(
    collection(db, 'symptoms'),
    where('userId', '==', userId),
    orderBy('dateISO', 'desc'),
    limit(pageSize)
  );
  const querySnapshot = await getDocs(q);
  const symptoms = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Symptom[];
  return { symptoms, total: symptoms.length };
};

export const createSymptom = async (userId: string, description: string, severity: number, dateISO: string) => {
  const symptomData = {
    userId,
    description,
    severity,
    dateISO,
    createdAt: new Date()
  };
  
  const docRef = await addDoc(collection(db, 'symptoms'), symptomData);
  return { id: docRef.id, ...symptomData };
};