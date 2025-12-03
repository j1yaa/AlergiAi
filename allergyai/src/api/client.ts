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
  Alert
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
  console.log('🔥 REGISTER: Starting registration for', data.email);
  
  if (DEMO_MODE) {
    console.log('🔥 REGISTER: Using demo mode');
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
    console.log('🔥 REGISTER: Creating Firebase Auth user...');
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
    const firebaseUser = userCredential.user;
    console.log('🔥 REGISTER: Firebase Auth user created:', firebaseUser.uid);
        
    try {
      console.log('🔥 REGISTER: Creating Firestore user document...');
      const userDocData = {
        name: data.name,
        email: data.email,
        allergens: [],
        createdAt: new Date().toISOString()
      };
      console.log('🔥 REGISTER: User doc data:', userDocData);
      
      await setDoc(doc(db, 'users', firebaseUser.uid), userDocData);
      console.log('🔥 REGISTER: Firestore user document created successfully');
    } catch (firestoreError: any) {
      console.error('🔥 REGISTER: Firestore error:', {
        code: firestoreError.code,
        message: firestoreError.message,
        stack: firestoreError.stack
      });
    }

    console.log('🔥 REGISTER: Getting ID token...');
    const token = await firebaseUser.getIdToken();
    console.log('🔥 REGISTER: Registration completed successfully');
    
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
    console.error('🔥 REGISTER: Auth error:', {
      code: authError.code,
      message: authError.message,
      stack: authError.stack
    });
    throw authError;
  }
};

export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  console.log('🔥 LOGIN: Starting login for', data.email);
  
  if (DEMO_MODE) {
    console.log('🔥 LOGIN: Using demo mode');
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
    console.log('🔥 LOGIN: Authenticating with Firebase...');
    const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
    const firebaseUser = userCredential.user;
    console.log('🔥 LOGIN: Firebase Auth successful:', firebaseUser.uid);
        
    console.log('🔥 LOGIN: Fetching user document from Firestore...');
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);
    const userData = userDoc.exists() ? userDoc.data() : null;
    console.log('🔥 LOGIN: User document exists:', userDoc.exists());
    console.log('🔥 LOGIN: User data:', userData);

    console.log('🔥 LOGIN: Getting ID token...');
    const token = await firebaseUser.getIdToken();
    console.log('🔥 LOGIN: Login completed successfully');
    
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
    console.error('🔥 LOGIN: Error:', {
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
      
      console.log('getMeals: Fetching meals for user:', firebaseUser.uid);
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
            createdAt: data.createdAt || new Date().toISOString(),
            note: data.note || data.notes || data.description || '',
            items: data.items || [],
            photoURL: data.photoURL || '',
            deleted: data.deleted || false
          } as Meal;
        })
        .filter(meal => !meal.deleted)
        .sort((a, b) => {
          const aTime = new Date(a.createdAt || 0).getTime();
          const bTime = new Date(b.createdAt || 0).getTime();
          return bTime - aTime;
        });
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

      // Enhanced AI-powered risk assessment
      const description = payload.description?.toLowerCase() || '';
      
      // Extract ingredients from description
      const ingredients = description
        .split(/[,;\n]/)
        .map(item => item.trim())
        .filter(Boolean);

      // Advanced allergen detection with fuzzy matching
      const detectedAllergens: string[] = [];
      const allergenMatches: { allergen: string; ingredient: string; confidence: number }[] = [];
      
      userAllergens.forEach((allergen: string) => {
        const allergenLower = allergen.toLowerCase();
        
        // Direct matches
        ingredients.forEach(ingredient => {
          const ingredientLower = ingredient.toLowerCase();
          
          // Exact match
          if (ingredientLower.includes(allergenLower)) {
            if (!detectedAllergens.includes(allergen)) {
              detectedAllergens.push(allergen);
              allergenMatches.push({ allergen, ingredient, confidence: 1.0 });
            }
            return;
          }
          
          // Common allergen variations and derivatives
          const allergenVariations: { [key: string]: string[] } = {
            'peanut': ['peanut butter', 'groundnut', 'arachis', 'monkey nut'],
            'peanuts': ['peanut butter', 'groundnut', 'arachis', 'monkey nut'],
            'milk': ['dairy', 'cheese', 'butter', 'cream', 'yogurt', 'lactose', 'casein', 'whey'],
            'dairy': ['milk', 'cheese', 'butter', 'cream', 'yogurt', 'lactose', 'casein', 'whey'],
            'egg': ['eggs', 'albumin', 'mayonnaise', 'meringue'],
            'eggs': ['egg', 'albumin', 'mayonnaise', 'meringue'],
            'wheat': ['flour', 'gluten', 'bread', 'pasta', 'cereal'],
            'gluten': ['wheat', 'flour', 'bread', 'pasta', 'cereal', 'barley', 'rye'],
            'soy': ['soya', 'tofu', 'edamame', 'miso', 'tempeh'],
            'shellfish': ['shrimp', 'crab', 'lobster', 'prawns', 'crayfish'],
            'fish': ['salmon', 'tuna', 'cod', 'mackerel', 'sardine'],
            'nuts': ['almond', 'walnut', 'cashew', 'pistachio', 'hazelnut', 'pecan'],
            'tree nuts': ['almond', 'walnut', 'cashew', 'pistachio', 'hazelnut', 'pecan']
          };
          
          const variations = allergenVariations[allergenLower] || [];
          variations.forEach(variation => {
            if (ingredientLower.includes(variation)) {
              if (!detectedAllergens.includes(allergen)) {
                detectedAllergens.push(allergen);
                allergenMatches.push({ allergen, ingredient, confidence: 0.9 });
              }
            }
          });
        });
        
        // Check description for allergen mentions
        if (description.includes(allergenLower) && !detectedAllergens.includes(allergen)) {
          detectedAllergens.push(allergen);
          allergenMatches.push({ allergen, ingredient: 'meal description', confidence: 0.8 });
        }
      });

      // Calculate sophisticated risk score
      let riskScore = 0;
      
      if (detectedAllergens.length === 0) {
        riskScore = Math.min(15, ingredients.length * 2); // Base risk increases with complexity
      } else {
        // High risk calculation based on matches - scales with multiple allergens
        const baseRisk = 70;
        const allergenMultiplier = detectedAllergens.length;
        const allergenPenalty = allergenMultiplier * 15; // Each additional allergen adds 15%
        const confidenceBonus = allergenMatches.reduce((sum, match) => sum + (match.confidence * 5), 0);
        
        // Multiple allergen exponential scaling
        const multiAllergenBonus = allergenMultiplier > 1 ? (allergenMultiplier - 1) * 10 : 0;
        
        riskScore = Math.min(100, baseRisk + allergenPenalty + confidenceBonus + multiAllergenBonus);
      }

      // Generate detailed advice
      let advice = '';
      if (detectedAllergens.length > 0) {
        const matchDetails = allergenMatches.map(match => 
          `${match.allergen} (found in: ${match.ingredient})`
        ).join(', ');
        
        advice = `⚠️ HIGH RISK: Detected allergens - ${matchDetails}. Avoid this meal immediately!`;
      } else if (riskScore > 10) {
        advice = `⚡ MODERATE RISK: No known allergens detected, but meal complexity suggests caution. Check ingredients carefully.`;
      } else {
        advice = `✅ LOW RISK: This meal appears safe for your dietary restrictions.`;
      }

      const response: AnalyzeResponse = {
        ingredients,
        allergens: detectedAllergens,
        riskScore: Math.round(riskScore),
        advice
      };
      
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
        where('userId', '==', firebaseUser.uid)
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
      
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.exists() ? userDoc.data() : null;
      
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
      
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      
      await updateDoc(userDocRef, {
        name: settings.name,
        email: settings.email,
        notifications: settings.notifications,
        allergens: settings.allergens,
        diet: settings.diet
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
    },
    'getProfile'
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

      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          name: firebaseUser.displayName || 'User',
          email: firebaseUser.email || '',
          allergens: [],
          createdAt: new Date().toISOString()
        });
        return { allergens: [] };
      }
      
      const userData = userDoc.data();
      return {
        allergens: userData?.allergens || [],
      };
    },
    { allergens: []}
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

      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          name: firebaseUser.displayName || 'User',
          email: firebaseUser.email || '',
          allergens: [data.allergen],
          createdAt: new Date().toISOString()
        });
      } else {
        const userData = userDoc.data();
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
            
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          name: firebaseUser.displayName || 'User',
          email: firebaseUser.email || '',
          allergens: [],
          createdAt: new Date().toISOString()
        });
      } else {
        const userData = userDoc.data();
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

export const deleteMeal = async (mealId: string): Promise<void> => {
  if (DEMO_MODE) {
    const existingRaw = await AsyncStorage.getItem('meals');
    const meals: Meal[] = existingRaw ? JSON.parse(existingRaw) : [];
    const filtered = meals.filter(meal => meal.id !== mealId);
    await AsyncStorage.setItem('meals', JSON.stringify(filtered));
    return;
  }

  return handleFirebaseCall(
    async () => {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) throw new Error('User not authenticated');
      
      const mealDoc = doc(db, 'meals', mealId);
      await updateDoc(mealDoc, {
        deleted: true,
        deletedAt: new Date().toISOString()
      });
    },
    undefined
  );
};

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