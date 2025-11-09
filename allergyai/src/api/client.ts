import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where, 
  orderBy
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { db, auth } from '../config/firebase';
import { DEMO_MODE } from '../config/demo';
import { 
  User, 
  Meal, 
  AnalyzeRequest, 
  AnalyzeResponse, 
  AlertsResponse, 
  AnalyticsSummary, 
  UserSettings,
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  Symptom,
  SymptomsResponse,
  SymptomAnalytics,
  UserProfile,
  AllergensResponse,
  AddAllergenRequest,
  RemoveAllergenRequest
} from '../types';
import { 
  mockUser, 
  mockMeals, 
  mockAnalytics, 
  mockUserSettings, 
  getMockAlertsResponse, 
  getMockAnalyzeResponse,
  getMockSymptomsResponse,
  mockSymptoms
} from './mocks';

const handleFirebaseCall = async <T>(firebaseCall: () => Promise<T>, mockData: T): Promise<T> => {
  if (DEMO_MODE) {
    return mockData;
  }
  try {
    return await firebaseCall();
  } catch (error) {
    console.error('Firebase call failed:', error);
    throw error;
  }
};

export const register = async (userData: RegisterRequest): Promise<AuthResponse> => {
  return handleFirebaseCall(
    async () => {
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      const user = userCredential.user;
      
      await addDoc(collection(db, 'users'), {
        uid: user.uid,
        name: userData.name,
        email: userData.email,
        allergens: [],
        createdAt: new Date().toISOString()
      });
      
      return {
        token: await user.getIdToken(),
        user: {
          id: user.uid,
          name: userData.name,
          email: userData.email,
          allergens: []
        }
      };
    },
    { token: 'demo.jwt.token', user: { ...mockUser, name: userData.name, email: userData.email } }
  );
};

export const login = async (credentials: LoginRequest): Promise<AuthResponse> => {
  return handleFirebaseCall(
    async () => {
      const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
      const user = userCredential.user;
      
      const userQuery = query(collection(db, 'users'), where('uid', '==', user.uid));
      const userDocs = await getDocs(userQuery);
      const userData = userDocs.docs[0]?.data();
      
      return {
        token: await user.getIdToken(),
        user: {
          id: user.uid,
          name: userData?.name || user.displayName || '',
          email: user.email || '',
          allergens: userData?.allergens || []
        }
      };
    },
    { token: 'demo.jwt.token', user: mockUser }
  );
};

export const getMeals = async (): Promise<Meal[]> => {
  return handleFirebaseCall(
    async () => {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      
      const mealsQuery = query(
        collection(db, 'meals'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(mealsQuery);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Meal[];
    },
    mockMeals
  );
};

export const analyzeMeal = async (payload: AnalyzeRequest): Promise<AnalyzeResponse> => {
  return handleFirebaseCall(
    async () => {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      
      const mockResponse = getMockAnalyzeResponse(payload.description);
      
      await addDoc(collection(db, 'meals'), {
        userId: user.uid,
        description: payload.description,
        ingredients: mockResponse.ingredients,
        allergens: mockResponse.allergens,
        riskScore: mockResponse.riskScore,
        advice: mockResponse.advice,
        createdAt: new Date().toISOString()
      });
      
      return mockResponse;
    },
    getMockAnalyzeResponse(payload.description)
  );
};

export const getAlerts = async (params?: { status?: string; page?: number; pageSize?: number }): Promise<AlertsResponse> => {
  return handleFirebaseCall(
    async () => {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      
      const alertsQuery = query(
        collection(db, 'alerts'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(alertsQuery);
      const alerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      return {
        items: alerts,
        page: params?.page || 1,
        pageSize: params?.pageSize || 20,
        total: alerts.length
      };
    },
    getMockAlertsResponse(params?.status)
  );
};

export const getAnalytics = async (): Promise<AnalyticsSummary> => {
  return handleFirebaseCall(
    async () => {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      
      const mealsSnapshot = await getDocs(query(collection(db, 'meals'), where('userId', '==', user.uid)));
      const alertsSnapshot = await getDocs(query(collection(db, 'alerts'), where('userId', '==', user.uid)));
      
      return {
        totalMeals: mealsSnapshot.size,
        totalAlerts: alertsSnapshot.size,
        riskScore: 2.5,
        weeklyTrend: [1, 3, 2, 4, 2, 1, 3]
      };
    },
    mockAnalytics
  );
};

export const getUserSettings = async (): Promise<UserSettings> => {
  return handleFirebaseCall(
    async () => {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      
      const userQuery = query(collection(db, 'users'), where('uid', '==', user.uid));
      const userDocs = await getDocs(userQuery);
      const userData = userDocs.docs[0]?.data();
      
      return {
        notifications: userData?.notifications || true,
        allergens: userData?.allergens || [],
        riskThreshold: userData?.riskThreshold || 3
      };
    },
    mockUserSettings
  );
};

export const updateUserSettings = async (settings: UserSettings): Promise<UserSettings> => {
  return handleFirebaseCall(
    async () => {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      
      const userQuery = query(collection(db, 'users'), where('uid', '==', user.uid));
      const userDocs = await getDocs(userQuery);
      const userDocRef = userDocs.docs[0]?.ref;
      
      if (userDocRef) {
        await updateDoc(userDocRef, settings);
      }
      
      return settings;
    },
    settings
  );
};

export const saveSymptom = async (symptom: Omit<Symptom, 'id'>): Promise<Symptom> => {
  const newSymptom = { ...symptom, id: `symptom-${Date.now()}` };
  
  if (DEMO_MODE) {
    try {
      const existingSymptoms = await AsyncStorage.getItem('symptoms');
      const symptoms = existingSymptoms ? JSON.parse(existingSymptoms) : [];
      symptoms.unshift(newSymptom);
      await AsyncStorage.setItem('symptoms', JSON.stringify(symptoms));
    } catch (error) {
      console.warn('Failed to save symptom to storage:', error);
    }
    return newSymptom;
  }
  
  return handleFirebaseCall(
    async () => {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      
      const docRef = await addDoc(collection(db, 'symptoms'), {
        ...symptom,
        userId: user.uid,
        createdAt: new Date().toISOString()
      });
      
      return { ...symptom, id: docRef.id };
    },
    newSymptom
  );
};

export const getSymptoms = async (): Promise<SymptomsResponse> => {
  if (DEMO_MODE) {
    try {
      const storedSymptoms = await AsyncStorage.getItem('symptoms');
      const symptoms = storedSymptoms ? JSON.parse(storedSymptoms) : mockSymptoms;
      return {
        items: symptoms,
        page: 1,
        pageSize: 20,
        total: symptoms.length
      };
    } catch (error) {
      console.warn('Failed to load symptoms from storage:', error);
      return getMockSymptomsResponse();
    }
  }
  
  return handleFirebaseCall(
    async () => {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      
      const symptomsQuery = query(
        collection(db, 'symptoms'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(symptomsQuery);
      const symptoms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Symptom[];
      
      return {
        items: symptoms,
        page: 1,
        pageSize: 20,
        total: symptoms.length
      };
    },
    getMockSymptomsResponse()
  );
};

export const getSymptomAnalytics = async (): Promise<SymptomAnalytics> => {
  if (DEMO_MODE) {
    try {
      const storedSymptoms = await AsyncStorage.getItem('symptoms');
      const symptoms = storedSymptoms ? JSON.parse(storedSymptoms) : mockSymptoms;
      const avgSeverity = symptoms.length > 0 ? Number((symptoms.reduce((sum: number, s: Symptom) => sum + s.severity, 0) / symptoms.length).toFixed(1)) : 0;
      
      return {
        avgSeverity,
        weeklySymptoms: [
          { week: 'Week 1', count: 1, avgSeverity: 2.0 },
          { week: 'Week 2', count: 3, avgSeverity: 3.5 },
          { week: 'Week 3', count: 2, avgSeverity: 2.5 },
          { week: 'Week 4', count: symptoms.length, avgSeverity }
        ],
        commonSymptoms: [
          { description: 'stomach discomfort', count: 5 },
          { description: 'skin rash', count: 3 },
          { description: 'headache', count: 2 }
        ]
      };
    } catch (error) {
      console.warn('Failed to load symptom analytics from storage:', error);
    }
  }
  
  return handleFirebaseCall(
    async () => {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      
      const symptomsQuery = query(collection(db, 'symptoms'), where('userId', '==', user.uid));
      const snapshot = await getDocs(symptomsQuery);
      const symptoms = snapshot.docs.map(doc => doc.data()) as Symptom[];
      
      const avgSeverity = symptoms.length > 0 ? 
        Number((symptoms.reduce((sum, s) => sum + s.severity, 0) / symptoms.length).toFixed(1)) : 0;
      
      return {
        avgSeverity,
        weeklySymptoms: [
          { week: 'Week 1', count: 1, avgSeverity: 2.0 },
          { week: 'Week 2', count: 3, avgSeverity: 3.5 },
          { week: 'Week 3', count: 2, avgSeverity: 2.5 },
          { week: 'Week 4', count: symptoms.length, avgSeverity }
        ],
        commonSymptoms: [
          { description: 'stomach discomfort', count: 5 },
          { description: 'skin rash', count: 3 },
          { description: 'headache', count: 2 }
        ]
      };
    },
    {
      avgSeverity: 3.0,
      weeklySymptoms: [
        { week: 'Week 1', count: 1, avgSeverity: 2.0 },
        { week: 'Week 2', count: 3, avgSeverity: 3.5 },
        { week: 'Week 3', count: 2, avgSeverity: 2.5 },
        { week: 'Week 4', count: 1, avgSeverity: 4.0 }
      ],
      commonSymptoms: [
        { description: 'stomach discomfort', count: 5 },
        { description: 'skin rash', count: 3 },
        { description: 'headache', count: 2 }
      ]
    }
  );
};

export const getProfile = async (): Promise<UserProfile> => {
    return handleFirebaseCall(
        async () => {
            const user = auth.currentUser;
            if (!user) throw new Error('User not authenticated');
            
            const userQuery = query(collection(db, 'users'), where('uid', '==', user.uid));
            const userDocs = await getDocs(userQuery);
            const userData = userDocs.docs[0]?.data();
            
            const mealsSnapshot = await getDocs(query(collection(db, 'meals'), where('userId', '==', user.uid)));
            const alertsSnapshot = await getDocs(query(collection(db, 'alerts'), where('userId', '==', user.uid)));
            
            return {
                id: user.uid,
                name: userData?.name || user.displayName || '',
                email: user.email || '',
                allergens: userData?.allergens || [],
                totalMeals: mealsSnapshot.size,
                totalAlerts: alertsSnapshot.size,
                createdAt: userData?.createdAt || new Date().toISOString(),
            };
        },
        {
            id: '1',
            name: 'John Doe',
            email: 'john@example.com',
            allergens: ['Peanuts', 'Shellfish', 'Dairy'],
            totalMeals: 127,
            totalAlerts: 8,
            createdAt: '2022-01-15T10:00:00Z',
        }
    );
}; 

export const getAllergens = async (): Promise<AllergensResponse> => {
    return handleFirebaseCall(
        async () => {
            const user = auth.currentUser;
            if (!user) throw new Error('User not authenticated');
            
            const userQuery = query(collection(db, 'users'), where('uid', '==', user.uid));
            const userDocs = await getDocs(userQuery);
            const userData = userDocs.docs[0]?.data();
            
            return {
                allergens: userData?.allergens || [],
            };
        },
        {
            allergens: ['Peanuts', 'Shellfish', 'Dairy'],
        }
    );
};

export const addAllergen = async (data: AddAllergenRequest): Promise<void> => {
    return handleFirebaseCall(
        async () => {
            const user = auth.currentUser;
            if (!user) throw new Error('User not authenticated');
            
            const userQuery = query(collection(db, 'users'), where('uid', '==', user.uid));
            const userDocs = await getDocs(userQuery);
            const userDocRef = userDocs.docs[0]?.ref;
            const userData = userDocs.docs[0]?.data();
            
            if (userDocRef) {
                const currentAllergens = userData?.allergens || [];
                await updateDoc(userDocRef, {
                    allergens: [...currentAllergens, data.allergen]
                });
            }
        },
        undefined as void
    );
};

export const removeAllergen = async (data: RemoveAllergenRequest): Promise<void> => {
    return handleFirebaseCall(
        async () => {
            const user = auth.currentUser;
            if (!user) throw new Error('User not authenticated');
            
            const userQuery = query(collection(db, 'users'), where('uid', '==', user.uid));
            const userDocs = await getDocs(userQuery);
            const userDocRef = userDocs.docs[0]?.ref;
            const userData = userDocs.docs[0]?.data();
            
            if (userDocRef) {
                const currentAllergens = userData?.allergens || [];
                await updateDoc(userDocRef, {
                    allergens: currentAllergens.filter((a: string) => a !== data.allergen)
                });
            }
        },
        undefined as void
    );
};

export async function createMeal(payload: { items: string[]; note?: string }): Promise<Meal> {
  const newMeal: Meal = {
    id: `meal-${Date.now()}`,
    items: payload.items,
    note: payload.note,
    createdAt: new Date().toISOString(),
  };

  if (DEMO_MODE) {
    const existingRaw = await AsyncStorage.getItem('meals');
    const existing: Meal[] = existingRaw ? JSON.parse(existingRaw) : [];
    await AsyncStorage.setItem('meals', JSON.stringify([newMeal, ...existing]));
    return newMeal;
  }

  return handleFirebaseCall(
    async () => {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      
      const docRef = await addDoc(collection(db, 'meals'), {
        ...newMeal,
        userId: user.uid
      });
      
      return { ...newMeal, id: docRef.id };
    },
    newMeal
  );
}

export const onAuthStateChange = (callback: (user: any) => void) => {
  return onAuthStateChanged(auth, callback);
};

export const logout = async (): Promise<void> => {
  await signOut(auth);
};