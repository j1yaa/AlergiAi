import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  collection, 
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
  RemoveAllergenRequest,
  Alert
} from '../types';


const handleFirebaseCall = async <T>(firebaseCall: () => Promise<T>, fallbackData: T): Promise<T> => {
  if (DEMO_MODE) {
    return fallbackData;
  }
  try {
    return await firebaseCall();
  } catch (error) {
    console.error('Firebase call failed:', error);
    return fallbackData;
  }
};

export const register = async (data: RegisterRequest): Promise<AuthResponse> => {
  if (DEMO_MODE) {
    const mockToken = 'demo-token-' + Date.now();
    await AsyncStorage.setItem('auth_token', mockToken);
    return {
      token: mockToken,
      user: {
        id: 'demo-user-' + Date.now(),
        name: data.name,
        email: data.email,
        passwordHash: '',
        createdAt: new Date(),
        allergens: []
      }
    };
  }

  const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
  const firebaseUser = userCredential.user;
      
  try {
    await addDoc(collection(db, 'users'), {
      uid: firebaseUser.uid,
      name: data.name,
      email: data.email,
      allergens: [],
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.warn('Failed to create user document, continuing with auth only:', error);
  }

  const token = await firebaseUser.getIdToken();
  return {
    token,
    user: {
      id: firebaseUser.uid,
      name: data.name,
      email: data.email,
      passwordHash: '',
      createdAt: new Date(),
      allergens: []
    }
  };
};

export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  if (DEMO_MODE) {
    const mockToken = 'demo-token-' + Date.now();
    await AsyncStorage.setItem('auth_token', mockToken);
    return {
      token: mockToken,
      user: {
        id: 'demo-user-1',
        name: 'Demo User',
        email: data.email,
        passwordHash: '',
        createdAt: new Date(),
        allergens: ['Peanuts', 'Shellfish']
      }
    };
  }

  const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
  const firebaseUser = userCredential.user;
      
  const userQuery = query(collection(db, 'users'), where('uid', '==', firebaseUser.uid));
  const userDocs = await getDocs(userQuery);
  const userData = userDocs.docs[0]?.data();

  const token = await firebaseUser.getIdToken();
  return {
    token,
    user: {
      id: firebaseUser.uid,
      name: userData?.name || firebaseUser.displayName || 'User',
      email: firebaseUser.email || '',
      passwordHash: '',
      createdAt: userData?.createdAt ? new Date(userData.createdAt) : new Date(),
      allergens: userData?.allergens || []
    }
  };
};

export const getMeals = async (): Promise<Meal[]> => {
  return handleFirebaseCall(
    async () => {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) throw new Error('User not authenticated');
      
      const mealsQuery = query(
        collection(db, 'meals'),
        where('userId', '==', firebaseUser.uid),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(mealsQuery);
      return snapshot.docs.map(doc => {
        const data = doc.data();
          return {
          id: doc.id,
          userId: data.userId,
          timeStamp: data.createdAt ? new Date(data.createdAt) : new Date(),
          notes: data.notes || '',
          photoURL: data.photoURL || '',
          items: data.items || []
        } as Meal;
      });
    },
    []
  );
};

export const analyzeMeal = async (payload: AnalyzeRequest): Promise<AnalyzeResponse> => {
  return handleFirebaseCall(
    async () => {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) throw new Error('User not authenticated');
      
      const userQuery = query(collection(db, 'users'), where('uid', '==', firebaseUser.uid));
      const userDocs = await getDocs(userQuery);
      const userData = userDocs.docs[0]?.data();
      const userAllergens = userData?.allergens || [];

      // Analyze the meal descritions for potential allergens
      const description = payload.description?.toLowerCase() || '';
      const detectedAllergens = userAllergens.filter((allergen: string) =>
        description.includes(allergen.toLowerCase())
      );

      const ingredients = description
        .split(/[,;]/)
        .map(item => item.trim())
        .filter(Boolean);

      const riskScore = detectedAllergens.length > 0 ? 85 : 15;

      const advice = detectedAllergens.length > 0
        ? `High allergen risk was detected: ${detectedAllergens.join(', ')}. Avoid this meal.`
        : 'This meal appears to be safe for your dietary restrictions.';

      const response: AnalyzeResponse = {
        ingredients,
        allergens: detectedAllergens,
        riskScore,
        advice
      };

      // Save the analyzed meal the Firabase
      await addDoc(collection(db, 'meals'), {
        userId: firebaseUser.uid,
        description: payload.description,
        ingredients: response.ingredients,
        allergens: response.allergens,
        riskScore: response.riskScore,
        advice: response.advice,
        createdAt: new Date().toISOString()
      });
      
      return response;
    },
    { ingredients: [], allergens: [], riskScore: 0, advice: 'Analysis unavailable' }
  );
};

export const getAlerts = async (params?: { status?: string; page?: number; pageSize?: number }): Promise<AlertsResponse> => {
  return handleFirebaseCall(
    async () => {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) throw new Error('User not authenticated');
      
      const alertsQuery = query(
        collection(db, 'alerts'),
        where('userId', '==', firebaseUser.uid),
        orderBy('timestamp', 'desc')
      );
      
      const snapshot = await getDocs(alertsQuery);
      const alerts = snapshot.docs.map(doc => {
        const data = doc.data();
          return {
            id: doc.id, 
            userId: data.userId,
            message: data.message,
            type: data.type,
            timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
            read: data.read || false,
            triggered: data.triggered || false,
            mealId: data.mealId || '',
            dateISO: data.timestamp || new Date().toISOString(),
            allergens: data.allergens || [],
            severity: data.severity || 'medium',
            note: data.note || ''
          } as Alert;
        });
      
        return {
          items: alerts,
          page: params?.page || 1,
          pageSize: params?.pageSize || 20,
          total: alerts.length
        };
      },
    { items: [], page: 1, pageSize: 20, total: 0 }
  );
};

export const getAnalytics = async (): Promise<AnalyticsSummary> => {
  return handleFirebaseCall(
    async () => {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) throw new Error('User not authenticated');
      
      const mealsSnapshot = await getDocs(query(collection(db, 'meals'), where('userId', '==', firebaseUser.uid)));
      const alertsSnapshot = await getDocs(query(collection(db, 'alerts'), where('userId', '==', firebaseUser.uid)));

      const meals = mealsSnapshot.docs.map(doc => doc.data());
      const totalMeals = meals.length;
      const safeMeals = meals.filter((meal: any) => (meal.riskScore || 0) < 50).length;
      const safeMealsPct = totalMeals > 0 ? Math.round((safeMeals / totalMeals) * 100) : 0;
   
      return {
        totalMeals,
        totalAlerts: alertsSnapshot.size,
        riskScore: 2.5,
        weeklyTrend: [1, 3, 2, 4, 2, 1, 3],
        safeMealsPct,
          weeklyExposure: [
            { week: 'Week 1', count: 1 },
            { week: 'Week 2', count: 3 },
            { week: 'Week 3', count: 2 },
            { week: 'Week 4', count: 4 }
          ],
        topAllergens: [
          { name: 'Peanuts', count: 3 },
          { name: 'Dairy', count: 2 },
          { name: 'Shellfish', count: 1 }
        ]
      };
    },
    { totalMeals: 0, totalAlerts: 0, riskScore: 0, weeklyTrend: [], safeMealsPct: 0, weeklyExposure: [], topAllergens: [] }
  );
};

export const getUserSettings = async (): Promise<UserSettings> => {
  return handleFirebaseCall(
    async () => {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) throw new Error('User not authenticated');
      
      const userQuery = query(collection(db, 'users'), where('uid', '==', firebaseUser.uid));
      const userDocs = await getDocs(userQuery);
      const userData = userDocs.docs[0]?.data();
      
      return {
        name: userData?.name || '',
        email: userData?.email || firebaseUser.email || '',
        allergens: userData?.allergens || [],
        diet: userData?.diet || '',
        notifications: userData?.notifications !== false
      };
    },
    { name: '', email: '', allergens: [], diet: '', notifications: true }
  );
};

export const updateUserSettings = async (settings: UserSettings): Promise<UserSettings> => {
  return handleFirebaseCall(
    async () => {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) throw new Error('User not authenticated');
      
      const userQuery = query(collection(db, 'users'), where('uid', '==', firebaseUser.uid));
      const userDocs = await getDocs(userQuery);
      const userDocRef = userDocs.docs[0]?.ref;
      
      if (userDocRef) {
        await updateDoc(userDocRef, {
          name: settings.name,
          email: settings.email,
          notifications: settings.notifications,
          allergens: settings.allergens,
          diet: settings.diet
        });
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
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) throw new Error('User not authenticated');
      
      const docRef = await addDoc(collection(db, 'symptoms'), {
        ...symptom,
        userId: firebaseUser.uid,
        createdAt: new Date().toISOString()
      });
      
      return { ...symptom, id: docRef.id };
    },
    newSymptom
  );
};

export const deleteSymptom = async (symptomId: string): Promise<void> => {
  if (DEMO_MODE) {
    try {
      const existingSymptoms = await AsyncStorage.getItem('symptoms');
      const symptoms = existingSymptoms ? JSON.parse(existingSymptoms) : [];
      const filtered = symptoms.filter((s: Symptom) => s.id !== symptomId);
      await AsyncStorage.setItem('symptoms', JSON.stringify(filtered));
    } catch (error) {
      console.warn('Failed to delete the symptom from the storage:', error);
      throw error;
    }
    return;
  }

  return handleFirebaseCall(
    async () => {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) throw new Error('User is not authenticated');

      const symptomsQuery = query(collection(db, 'symptoms'), where('userId', '==', firebaseUser.uid));
      const snapshot = await getDocs(symptomsQuery);
      const symptomDoc = snapshot.docs.find(doc => doc.id === symptomId);

      if (symptomDoc) {
        await updateDoc(symptomDoc.ref, {
          deleted: true,
          deletedAt: new Date().toISOString()
        });
      }
    },
    undefined
  );
};

export const getSymptoms = async (): Promise<SymptomsResponse> => {
  if (DEMO_MODE) {
    try {
      const storedSymptoms = await AsyncStorage.getItem('symptoms');
      const symptoms = storedSymptoms ? JSON.parse(storedSymptoms) : [];
      return {
        items: symptoms,
        page: 1,
        pageSize: 20,
        total: symptoms.length
      };
    } catch (error) {
      console.warn('Failed to load symptoms from storage:', error);
      return { items: [], page: 1, pageSize: 20, total: 0 };
    }
  }
  
  return handleFirebaseCall(
    async () => {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) throw new Error('User not authenticated');
      
      const symptomsQuery = query(
        collection(db, 'symptoms'),
        where('userId', '==', firebaseUser.uid),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(symptomsQuery);
      const symptoms = snapshot.docs.map(doc => 
          ({ id: doc.id, ...doc.data() })).filter((s: any) => !s.deleted) as Symptom[];
      
      return {
        items: symptoms,
        page: 1,
        pageSize: 20,
        total: symptoms.length
      };
    },
    { items: [], page: 1, pageSize: 20, total: 0 }
  );
};

export const getSymptomAnalytics = async (): Promise<SymptomAnalytics> => {
  if (DEMO_MODE) {
    try {
      const storedSymptoms = await AsyncStorage.getItem('symptoms');
      const symptoms = storedSymptoms ? JSON.parse(storedSymptoms) : [];
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
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) throw new Error('User not authenticated');
      
      const symptomsQuery = query(collection(db, 'symptoms'), where('userId', '==', firebaseUser.uid));
      const snapshot = await getDocs(symptomsQuery);
      const symptoms = snapshot.docs.map(doc => doc.data()).filter((s: any) => !s.deleted) as Symptom[];
      
      const avgSeverity = symptoms.length > 0 ? 
      Number((symptoms.reduce((sum, s) => sum + s.severity, 0) / symptoms.length).toFixed(1)) : 0;

      const now = new Date();
      const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
      const recentSymptoms = symptoms.filter(s => new Date(s.dateISO) >= fourWeeksAgo);

      return {
        avgSeverity,
        weeklySymptoms: [
          { week: 'Week 1', count: 1, avgSeverity: 2.0 },
          { week: 'Week 2', count: 3, avgSeverity: 3.5 },
          { week: 'Week 3', count: 2, avgSeverity: 2.5 },
          { week: 'Week 4', count: recentSymptoms.length, avgSeverity }
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
  if (DEMO_MODE) {
    try {
      const storedAllergensData = await AsyncStorage.getItem('@allergyai_allergens');
        const userAllergens = storedAllergensData ? JSON.parse(storedAllergensData) : [];

        const storedUserData = await AsyncStorage.getItem('@allergyai_user');
        const userData = storedUserData ? JSON.parse(storedUserData) : {
          id: '1',
          name: 'Demo User',
          email: 'demo@example.com',
          createdAt: new Date().toISOString(),
        };

        return {
          id: userData.id || '1',
          name: userData.name || 'Demo User',
          email: userData.email || 'demo@example.com',
          allergens: userAllergens,
          totalMeals: userData.totalMeals || 0,
          totalAlerts: userData.totalAlerts || 0,
          createdAt: userData.createdAt || new Date().toISOString(),
        };
      } catch (error) {
        console.error('Failed to load the profile from storage:', error);
        return {
          id: '1',
          name: 'Demo User',
          email: 'demo@example.com',
          allergens: [],
          totalMeals: 0,
          totalAlerts: 0,
          createdAt: new Date().toISOString(),
        };
      }
  }

  return handleFirebaseCall(
    async () => {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) throw new Error('User not authenticated');
           
      const userQuery = query(collection(db, 'users'), where('uid', '==', firebaseUser.uid));
      const userDocs = await getDocs(userQuery);
      const userData = userDocs.docs[0]?.data();
            
      const mealsSnapshot = await getDocs(query(collection(db, 'meals'), where('userId', '==', firebaseUser.uid)));
      const alertsSnapshot = await getDocs(query(collection(db, 'alerts'), where('userId', '==', firebaseUser.uid)));
            
      return {
        id: firebaseUser.uid,
        name: userData?.name || firebaseUser.displayName || '',
        email: firebaseUser.email || '',
        allergens: userData?.allergens || [],
        totalMeals: mealsSnapshot.size,
        totalAlerts: alertsSnapshot.size,
        createdAt: userData?.createdAt || new Date().toISOString(),
      };
    },
    {
      id: '1',
      name: 'Demo User',
      email: 'demo@example.com',
      allergens: [],
      totalMeals: 0,
      totalAlerts: 0,
      createdAt: new Date().toISOString(),
    }
  );
}; 

export const getAllergens = async (): Promise<AllergensResponse> => {
  if (DEMO_MODE) {
    try {
      const stored = await AsyncStorage.getItem('@allergyai_allergens');
      const allergens = stored ? JSON.parse(stored) : [];
      return {allergens};
    } catch (error) {
      console.error('Failed to load allergens from storage:', error);
      return {allergens: []};
    }
  }

  return handleFirebaseCall(
    async () => {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) throw new Error('User is not authenticated');

      const userQuery = query(collection(db, 'users'), where('uid', '==', firebaseUser.uid));
      const userDocs = await getDocs(userQuery);
      const userData = userDocs.docs[0]?.data();

      return {
        allergens: userData?.allergens || [],
      };
    },
    { allergens: ['Peanuts', 'Shellfish', 'Dairy']}
  ); 
};

export const addAllergen = async (data: AddAllergenRequest): Promise<void> => {
  if (DEMO_MODE) {
    try {
      const stored = await AsyncStorage.getItem('@allergyai_allergens');
      const allergens = stored ? JSON.parse(stored) : [];
      // Check if there duplicates
      if (!allergens.includes(data.allergen)) {
        allergens.push(data.allergen);
        await AsyncStorage.setItem('@allergyai_allergens', JSON.stringify(allergens));
      }
    } catch (error) {
      console.error('Failed to add the allergen to storage:', error);
      throw error;      
    }
    return;
  }

  return handleFirebaseCall(
    async () => {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) throw new Error('User is not authenticated');

      const userQuery = query(collection(db, 'users'), where('uid', '==', firebaseUser.uid));
      const userDocs = await getDocs(userQuery);
      const userDocRef = userDocs.docs[0]?.ref;
      const userData = userDocs.docs[0]?.data();

      if (userDocRef) {
        const currentAllergens = userData?.allergens || [];
        if (!currentAllergens.includes(data.allergen)) {
          await updateDoc(userDocRef, {
            allergens: [...currentAllergens, data.allergen]
          });
        }
      }
    },
    undefined
  );
};

export const removeAllergen = async (data: RemoveAllergenRequest): Promise<void> => {
  if (DEMO_MODE) {
    try {
      const stored = await AsyncStorage.getItem('@allergyai_allergens');
      const allergens = stored ? JSON.parse(stored) : [];
      const filtered = allergens.filter((a: string) => a !== data.allergen);
        await AsyncStorage.setItem('@allergyai_allergens', JSON.stringify(filtered));
      } catch (error) {
        console.error('Failed to remove the allergen from storage:', error);
        throw error;
      }
      return;
  }
  
  return handleFirebaseCall(
    async () => {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) throw new Error('User not authenticated');
            
      const userQuery = query(collection(db, 'users'), where('uid', '==', firebaseUser.uid));
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
    undefined
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
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) throw new Error('User not authenticated');
      
      const docRef = await addDoc(collection(db, 'meals'), {
        ...newMeal,
        userId: firebaseUser.uid
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
  console.log('logout() called, DEMO_MODE:', DEMO_MODE);
  if (DEMO_MODE) {
    await AsyncStorage.removeItem('auth_token');
    console.log('Demo mode: auth_token removed');
      return;
  }
  console.log('Calling Firebase signOut');
  await signOut(auth);
  console.log('Firebase signOut completed');
};