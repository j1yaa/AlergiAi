import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  doc,
  setDoc,
  getDoc
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
  Alert,
  WearableData,
  HealthMetrics
} from '../types';


const handleFirebaseCall = async <T>(firebaseCall: () => Promise<T>, fallbackData: T, functionName?: string): Promise<T> => {
  if (DEMO_MODE) {
    console.log(`${functionName || 'Firebase call'}: Using demo mode fallback`);
    return fallbackData;
  }
  try {
    const result = await firebaseCall();
    console.log(`${functionName || 'Firebase call'}: Success`);
    return result;
  } catch (error: any) {
    console.error(`${functionName || 'Firebase call'} failed:`, {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    return fallbackData;
  }
};

export const register = async (data: RegisterRequest): Promise<AuthResponse> => {
  console.log('REGISTER: Starting registration for', data.email);
  
  if (DEMO_MODE) {
    console.log('REGISTER: Using demo mode');
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

  try {
    console.log('REGISTER: Creating Firebase Auth user...');
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
    const firebaseUser = userCredential.user;
    console.log('REGISTER: Firebase Auth user created:', firebaseUser.uid);
        
    try {
      console.log('REGISTER: Creating Firestore user document...');
      const userDocData = {
        name: data.name,
        email: data.email,
        allergens: [],
        createdAt: new Date().toISOString()
      };
      console.log('REGISTER: User doc data:', userDocData);
      
      await setDoc(doc(db, 'users', firebaseUser.uid), userDocData);
      console.log('REGISTER: Firestore user document created successfully');
    } catch (firestoreError: any) {
      console.error('REGISTER: Firestore error:', {
        code: firestoreError.code,
        message: firestoreError.message,
        stack: firestoreError.stack
      });
    }

    console.log('REGISTER: Getting ID token...');
    const token = await firebaseUser.getIdToken();
    console.log('REGISTER: Registration completed successfully');
    
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
  } catch (authError: any) {
    console.error('REGISTER: Auth error:', {
      code: authError.code,
      message: authError.message,
      stack: authError.stack
    });
    throw authError;
  }
};

export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  console.log('LOGIN: Starting login for', data.email);
  
  if (DEMO_MODE) {
    console.log('LOGIN: Using demo mode');
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

  try {
    console.log('LOGIN: Authenticating with Firebase...');
    const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
    const firebaseUser = userCredential.user;
    console.log('LOGIN: Firebase Auth successful:', firebaseUser.uid);
        
    console.log('LOGIN: Fetching user document from Firestore...');
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);
    const userData = userDoc.exists() ? userDoc.data() : null;
    console.log('LOGIN: User document exists:', userDoc.exists());
    console.log('LOGIN: User data:', userData);

    console.log('LOGIN: Getting ID token...');
    const token = await firebaseUser.getIdToken();
    console.log('LOGIN: Login completed successfully');
    
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
  } catch (error: any) {
    console.error('LOGIN: Error:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
};

export const getMeals = async (): Promise<Meal[]> => {
  if (DEMO_MODE) {
    try {
      const existingRaw = await AsyncStorage.getItem('meals');
      const meals: Meal[] = existingRaw ? JSON.parse(existingRaw) : [];
      return meals;
    } catch (error) {
      console.warn('Failed to load meals from storage:', error);
      return [];
    }
  }

  return handleFirebaseCall(
    async () => {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        console.warn('getMeals: User not authenticated, returning empty array');
        return [];
      }
      
      const mealsQuery = query(
        collection(db, 'meals'),
        where('userId', '==', firebaseUser.uid)
      );
      const snapshot = await getDocs(mealsQuery);
      return snapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            userId: data.userId,
            timeStamp: data.createdAt ? new Date(data.createdAt) : new Date(),
            notes: data.notes || '',
            photoURL: data.photoURL || '',
            items: data.items || [],
            allergens: data.allergens || [],
            deleted: data.deleted || false
          } as Meal;
        })
        .filter((meal: any) => !meal.deleted)
        .sort((a, b) => (b.timeStamp?.getTime() || 0) - (a.timeStamp?.getTime() || 0));
    },
    [],
    'getMeals'
  );
};

export const analyzeMeal = async (payload: AnalyzeRequest): Promise<AnalyzeResponse> => {
  return handleFirebaseCall(
    async () => {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) throw new Error('User not authenticated');
      
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.exists() ? userDoc.data() : null;
      const userAllergens = userData?.allergens || [];
      const allergensSeverity = userData?.allergensSeverity || [];

      // Parse ingredients from description
      const description = payload.description?.toLowerCase() || '';
      const ingredients = description
        .split(/[,;]/)
        .map(item => item.trim())
        .filter(Boolean);

      // Create allergen matches with severity information.
      // Sensitivity is derived from severity: high/severe profile entries mean severe personal sensitivity.
      const severityToSensitivity = (s: string): 'mild' | 'moderate' | 'severe' => {
        if (s === 'high' || s === 'severe') return 'severe';
        if (s === 'moderate') return 'moderate';
        return 'mild';
      };
      const allergenMatches = userAllergens.map((allergen: string) => {
        const severityInfo = allergensSeverity.find((as: any) => as.name.toLowerCase() === allergen.toLowerCase());
        const sev: 'minimal' | 'low' | 'moderate' | 'high' | 'severe' = severityInfo?.severity || 'moderate';
        return {
          allergen: allergen.toLowerCase(),
          severity: sev,
          sensitivity: severityToSensitivity(sev),
        };
      });

      // Use the scientific risk calculation
      const { computeRiskScore } = await import('../utils/smartAnalyzer');
      const riskResult = computeRiskScore(ingredients, allergenMatches);

      const advice = riskResult.matchedAllergens.length > 0
        ? `${riskResult.riskTier} detected: ${riskResult.matchedAllergens.join(', ')}. ${riskResult.explanation || ''}`
        : 'This meal appears to be safe for your dietary restrictions.';

      return {
        ingredients,
        allergens: riskResult.matchedAllergens,
        riskScore: riskResult.riskScore,
        advice
      };
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
        where('userId', '==', firebaseUser.uid)
      );
      
      const snapshot = await getDocs(alertsQuery);
      console.log('getAlerts: found', snapshot.docs.length, 'docs');
      const alerts = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('getAlerts: raw doc:', JSON.stringify(data));
        // Handle Firestore timestamp conversion
        let timestampISO: string;
        if (data.timestamp?.toDate) {
          // Firestore Timestamp object
          timestampISO = data.timestamp.toDate().toISOString();
        } else if (data.timestamp instanceof Date) {
          timestampISO = data.timestamp.toISOString();
        } else if (typeof data.timestamp === 'string') {
          timestampISO = data.timestamp;
        } else {
          timestampISO = new Date().toISOString();
        }
        
        return {
          id: doc.id, 
          userId: data.userId,
          message: data.message,
          type: data.type,
          timestamp: new Date(timestampISO),
          read: data.read || false,
          triggered: data.triggered || false,
          mealId: data.mealId || '',
          dateISO: timestampISO,
          allergens: data.allergens || [data.allergen].filter(Boolean),
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

      const meals = mealsSnapshot.docs
        .map(doc => doc.data())
        .filter((meal: any) => !meal.deleted);
      const totalMeals = meals.length;
      const safeMeals = meals.filter((meal: any) => (meal.riskScore || 0) < 50).length;
      const safeMealsPct = totalMeals > 0 ? Math.round((safeMeals / totalMeals) * 100) : 0;
   
      // Calculate actual weekly exposure from alerts
      const now = new Date();
      const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
      const alerts = alertsSnapshot.docs.map(doc => doc.data());
      
      const weeklyExposure = [];
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
        const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
        const count = alerts.filter((alert: any) => {
          const alertDate = alert.timestamp?.toDate ? alert.timestamp.toDate() : new Date(alert.timestamp);
          return alertDate >= weekStart && alertDate < weekEnd;
        }).length;
        weeklyExposure.push({ week: `W${4 - i}`, count });
      }

      // Calculate top allergens from alerts
      const allergenCounts: { [key: string]: number } = {};
      alerts.forEach((alert: any) => {
        const allergens = alert.allergens || [alert.allergen].filter(Boolean);
        allergens.forEach((allergen: string) => {
          allergenCounts[allergen] = (allergenCounts[allergen] || 0) + 1;
        });
      });
      
      const topAllergens = Object.entries(allergenCounts)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 3)
        .map(([name, count]) => ({ name, count: count as number }));

      return {
        totalMeals,
        totalAlerts: alertsSnapshot.size,
        riskScore: 2.5,
        weeklyTrend: [1, 3, 2, 4, 2, 1, 3],
        safeMealsPct,
        weeklyExposure,
        topAllergens: topAllergens.length > 0 ? topAllergens : [{ name: 'No exposures', count: 0 }]
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
      
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.exists() ? userDoc.data() : null;
      
      return {
        name: userData?.name || '',
        email: userData?.email || firebaseUser.email || '',
        allergens: userData?.allergens || [],
        diet: userData?.diet || '',
        notifications: userData?.notifications !== false,
        medicalNotes: userData?.medicalNotes || ''
      };
    },
    { name: '', email: '', allergens: [], diet: '',
    notifications: true, medicalNotes: '' }
  );
};

export const updateUserSettings = async (settings: UserSettings): Promise<UserSettings> => {
  return handleFirebaseCall(
    async () => {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) throw new Error('User not authenticated');
      
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      
      await updateDoc(userDocRef, {
        name: settings.name,
        email: settings.email,
        notifications: settings.notifications,
        allergens: settings.allergens,
        diet: settings.diet,
        medicalNotes: settings.medicalNotes || ''
      });
      
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
      if (!firebaseUser) {
        console.warn('getSymptoms: User not authenticated, returning empty array');
        return { items: [], page: 1, pageSize: 20, total: 0 };
      }
      
      const symptomsQuery = query(
        collection(db, 'symptoms'),
        where('userId', '==', firebaseUser.uid)
      );
      const snapshot = await getDocs(symptomsQuery);
      const symptoms = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((s: any) => !s.deleted)
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) as Symptom[];
      
      return {
        items: symptoms,
        page: 1,
        pageSize: 20,
        total: symptoms.length
      };
    },
    { items: [], page: 1, pageSize: 20, total: 0 },
    'getSymptoms'
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
    return {
      id: '1',
      name: 'Demo User',
      email: 'demo@example.com',
      allergens: ['Peanuts', 'Shellfish'],
      totalMeals: 5,
      totalAlerts: 2,
      createdAt: new Date().toISOString(),
    };
  }
  
  // Wait for auth state to be ready
  await new Promise(resolve => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      unsubscribe();
      resolve(user);
    });
  });

  return handleFirebaseCall(
    async () => {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        console.warn('getProfile: User not authenticated, returning fallback profile');
        return {
          id: 'anonymous',
          name: 'Anonymous User',
          email: 'anonymous@example.com',
          allergens: [],
          totalMeals: 0,
          totalAlerts: 0,
          createdAt: new Date().toISOString(),
        };
      }
           
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.exists() ? userDoc.data() : null;
            
      return {
        id: firebaseUser.uid,
        name: userData?.name || firebaseUser.displayName || 'User',
        email: firebaseUser.email || '',
        allergens: userData?.allergens || [],
        totalMeals: 0,
        totalAlerts: 0,
        createdAt: userData?.createdAt || new Date().toISOString(),
        medicalNotes: userData?.medicalNotes || '',
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
      medicalNotes: '',
    },
    'getProfile'
  );
}; 

export const getAllergens = async (): Promise<AllergensResponse> => {
  if (DEMO_MODE) {
    try {
      const stored = await AsyncStorage.getItem('@allergyai_allergens');
      const allergens = stored ? JSON.parse(stored) : [];
      const storedSeverity = await AsyncStorage.getItem('@allergyai_allergens_severity');
      const allergensSeverity = storedSeverity ? JSON.parse(storedSeverity) : [];
      return {allergens, allergensSeverity};
    } catch (error) {
      console.error('Failed to load allergens from storage:', error);
      return {allergens: [], allergensSeverity: []};
    }
  }

  return handleFirebaseCall(
    async () => {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) throw new Error('User is not authenticated');

      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.exists() ? userDoc.data() : null;

      return {
        allergens: userData?.allergens || [],
        allergensSeverity: userData?.allergensSeverity || []
      };
    },
    { allergens: ['Peanuts', 'Shellfish', 'Dairy'], allergensSeverity: [] }
  );
};

export const addAllergen = async (data: AddAllergenRequest): Promise<void> => {
  if (DEMO_MODE) {
    try {
      const stored = await AsyncStorage.getItem('@allergyai_allergens');
      const allergens = stored ? JSON.parse(stored) : [];
      const storedSeverity = await AsyncStorage.getItem('@allergyai_allergens_severity');
      const allergensSeverity = storedSeverity ? JSON.parse(storedSeverity) : [];

      if (!allergens.includes(data.allergen)) {
        allergens.push(data.allergen);
      }
      // Upsert severity: replace any stale entry for this allergen
      const filtered = allergensSeverity.filter((a: any) => a.name.toLowerCase() !== data.allergen.toLowerCase());
      filtered.push({ name: data.allergen, severity: data.severity || 'moderate' });
      await AsyncStorage.setItem('@allergyai_allergens', JSON.stringify(allergens));
      await AsyncStorage.setItem('@allergyai_allergens_severity', JSON.stringify(filtered));
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

      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.exists() ? userDoc.data() : null;

      if (userData) {
        const currentAllergens = userData.allergens || [];
        const currentAllergensSeverity: any[] = userData.allergensSeverity || [];
        const newAllergens = currentAllergens.includes(data.allergen)
          ? currentAllergens
          : [...currentAllergens, data.allergen];
        // Upsert severity: replace any stale entry for this allergen
        const filteredSeverity = currentAllergensSeverity.filter(
          (a: any) => a.name.toLowerCase() !== data.allergen.toLowerCase()
        );
        filteredSeverity.push({ name: data.allergen, severity: data.severity || 'moderate' });
        await updateDoc(userDocRef, {
          allergens: newAllergens,
          allergensSeverity: filteredSeverity,
        });
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
      const storedSeverity = await AsyncStorage.getItem('@allergyai_allergens_severity');
      const allergensSeverity = storedSeverity ? JSON.parse(storedSeverity) : [];
      const filteredSeverity = allergensSeverity.filter((a: any) => a.name !== data.allergen);
      await AsyncStorage.setItem('@allergyai_allergens_severity', JSON.stringify(filteredSeverity));
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

      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.exists() ? userDoc.data() : null;

      if (userData) {
        const currentAllergens = userData.allergens || [];
        const currentAllergensSeverity = userData.allergensSeverity || [];
        await updateDoc(userDocRef, {
          allergens: currentAllergens.filter((a: string) => a !== data.allergen),
          allergensSeverity: currentAllergensSeverity.filter((a: any) => a.name !== data.allergen)
        });
      }
    },
    undefined
  );
};

export const updateAllergenSeverity = async (allergen: string, severity: 'minimal' | 'low' | 'moderate' | 'high' | 'severe'): Promise<void> => {
  if (DEMO_MODE) {
    try {
      const storedSeverity = await AsyncStorage.getItem('@allergyai_allergens_severity');
      const allergensSeverity = storedSeverity ? JSON.parse(storedSeverity) : [];
      const updated = allergensSeverity.map((a: any) =>
        a.name.toLowerCase() === allergen.toLowerCase() ? { ...a, severity } : a
      );
      if (!updated.some((a: any) => a.name.toLowerCase() === allergen.toLowerCase())) {
        updated.push({ name: allergen, severity });
      }
      await AsyncStorage.setItem('@allergyai_allergens_severity', JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to update allergen severity:', error);
      throw error;
    }
    return;
  }

  return handleFirebaseCall(
    async () => {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) throw new Error('User is not authenticated');

      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.exists() ? userDoc.data() : null;

      if (userData) {
        const current: any[] = userData.allergensSeverity || [];
        const updated = current.map((a: any) =>
          a.name.toLowerCase() === allergen.toLowerCase() ? { ...a, severity } : a
        );
        if (!updated.some((a: any) => a.name.toLowerCase() === allergen.toLowerCase())) {
          updated.push({ name: allergen, severity });
        }
        await updateDoc(userDocRef, { allergensSeverity: updated });
      }
    },
    undefined
  );
};

export async function createMeal(payload: { items: string[]; note?: string; allergens?: string[] }): Promise<Meal> {
  const newMeal: Meal = {
    id: `meal-${Date.now()}`,
    items: payload.items,
    notes: payload.note || '',
    allergens: payload.allergens || [],
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
        userId: firebaseUser.uid,
        items: newMeal.items,
        notes: newMeal.notes,
        allergens: newMeal.allergens,
        photoURL: '',
        createdAt: newMeal.createdAt
      });
      
      return { ...newMeal, id: docRef.id };
    },
    newMeal
  );
}

export async function deleteMeal(mealId: string): Promise<void> {
  if (DEMO_MODE) {
    const existingRaw = await AsyncStorage.getItem('meals');
    const existing: Meal[] = existingRaw ? JSON.parse(existingRaw) : [];
    const filtered = existing.filter(m => m.id !== mealId);
    await AsyncStorage.setItem('meals', JSON.stringify(filtered));
    return;
  }

  return handleFirebaseCall(
    async () => {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) throw new Error('User not authenticated');
      
      const mealRef = doc(db, 'meals', mealId);
      await updateDoc(mealRef, {
        deleted: true,
        deletedAt: new Date().toISOString()
      });
    },
    undefined
  );
}

export const onAuthStateChange = (callback: (user: any) => void) => {
  return onAuthStateChanged(auth, callback);
};

export const logout = async (): Promise<void> => {
  console.log('logout() called, DEMO_MODE:', DEMO_MODE);
  
  // Clear saved credentials
  await AsyncStorage.removeItem('saved_email');
  await AsyncStorage.removeItem('saved_password');
  await AsyncStorage.removeItem('remember_me');
  
  if (DEMO_MODE) {
    await AsyncStorage.removeItem('auth_token');
    console.log('Demo mode: auth_token removed');
      return;
  }
  console.log('Calling Firebase signOut');
  await signOut(auth);
  console.log('Firebase signOut completed');
};

export const saveWearableData = async (data: Omit<WearableData, 'id'>): Promise<WearableData> => {
    return handleFirebaseCall(
        async () => {
            const firebaseUser = auth.currentUser;
            if (!firebaseUser) throw new Error('User not authenticated');

            const docRef = await addDoc(collection(db, 'wearableData'), {
                ...data,
                userId: firebaseUser.uid,
                syncedAt: new Date().toISOString()
            });

            return { ...data, id: docRef.id };
        },
        { ...data, id: `wearable-${Date.now()}` }
    );
};

export const getHealthMetrics = async (): Promise<HealthMetrics> => {
    return handleFirebaseCall(
        async () => {
            const firebaseUser = auth.currentUser;
            if (!firebaseUser) throw new Error('User not authenticated');

            const wearableQuery = query(
                collection(db, 'wearableData'),
                where('userId', '==', firebaseUser.uid),
                orderBy('timestamp', 'desc')
            );

            const snapshot = await getDocs(wearableQuery);
            const data = snapshot.docs.map(doc => doc.data());

            const avgHeartRate = data.length > 0 ? data.reduce((sum, d) => sum + (d.heartRate || 0), 0) / data.length : 0;
            const avgSteps = data.length > 0 ? data.reduce((sum, d) => sum + (d.steps || 0), 0) / data.length : 0;
            const avgSleep = data.length > 0 ? data.reduce((sum, d) => sum + (d.sleepHours || 0), 0) / data.length : 0;
            const avgStress = data.length > 0 ? data.reduce((sum, d) => sum + (d.stressLevel || 0), 0) / data.length : 0;

            return {
                avgHeartRate: Math.round(avgHeartRate),
                dailySteps: Math.round(avgSteps),
                sleepQuality: Math.round(avgSleep * 10),
                stressLevel: Math.round(avgStress),
                correlationWithSymptoms: 0.65
            };
        },
        {
            avgHeartRate: 0,
            dailySteps: 0,
            sleepQuality: 0,
            stressLevel: 0,
            correlationWithSymptoms: 0
        }
    );
};

export const getMealTrends = async () => {
  const meals = await getMeals();
  const symptomsResponse = await getSymptoms();
  const symptoms = symptomsResponse.items || [];
  
  // Last 7 days meals - always Mon-Sun order
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
  sevenDaysAgo.setHours(0, 0, 0, 0);
  
  // Count meals per day of week
  const dayCountMap: { [key: string]: number } = {
    'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0, 'Sun': 0
  };
  
  meals.forEach(meal => {
    const mealDate = meal.createdAt ? new Date(meal.createdAt) : meal.timeStamp;
    if (!mealDate) return;
    const mealTime = mealDate instanceof Date ? mealDate : new Date(mealDate);
    
    // Only count meals from last 7 days
    if (mealTime >= sevenDaysAgo && mealTime <= now) {
      const dayIndex = mealTime.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
      const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayIndex];
      dayCountMap[dayName]++;
    }
  });
  
  const dailyMeals = days.map(day => ({ day, count: dayCountMap[day] }));

  // Top 3 allergens from last 7 days
  const allergenCounts: { [key: string]: number } = {};
  meals.forEach(meal => {
    const mealDate = meal.createdAt ? new Date(meal.createdAt) : meal.timeStamp;
    if (!mealDate) return;
    const mealTime = mealDate instanceof Date ? mealDate : new Date(mealDate);
    
    if (mealTime >= sevenDaysAgo && mealTime <= now) {
      meal.allergens?.forEach(allergen => {
        allergenCounts[allergen] = (allergenCounts[allergen] || 0) + 1;
      });
    }
  });
  
  const topAllergens = Object.entries(allergenCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([name, count]) => ({ name, count }))
    .filter(item => item.count > 0);

  // Reactions this week vs last week
  const weekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const twoWeeksAgo = now.getTime() - 14 * 24 * 60 * 60 * 1000;

  const reactionsThisWeek = symptoms.filter(s => {
    const symptomDate = s.dateISO ? new Date(s.dateISO) : (s as any).timestamp ? new Date((s as any).timestamp) : null;
    return symptomDate && symptomDate.getTime() > weekAgo;
  }).length;
  
  const reactionsLastWeek = symptoms.filter(s => {
    const symptomDate = s.dateISO ? new Date(s.dateISO) : (s as any).timestamp ? new Date((s as any).timestamp) : null;
    if (!symptomDate) return false;
    const time = symptomDate.getTime();
    return time > twoWeeksAgo && time <= weekAgo;
  }).length;

  return {
    dailyMeals,
    topAllergens: topAllergens.length > 0 ? topAllergens : [],
    reactionsThisWeek,
    reactionsLastWeek
  };
};
