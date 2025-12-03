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
import { analyzeIngredientRisk } from '../data/foodDatabase';
import { GEMINI_API_KEY } from '@env';
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
      const meals = snapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            userId: data.userId,
            createdAt: data.createdAt || new Date().toISOString(),
            note: data.note || data.notes || data.description || '',
            items: data.items || data.ingredients || [],
            photoURL: data.photoURL || '',
            riskScore: data.riskScore || 0,
            deleted: data.deleted || false
          } as Meal;
        })
        .filter(meal => !meal.deleted)
        .sort((a, b) => {
          const aTime = new Date(a.createdAt || 0).getTime();
          const bTime = new Date(b.createdAt || 0).getTime();
          return bTime - aTime;
        });
      
      console.log(`getMeals: Found ${meals.length} meals for user`);
      console.log('getMeals: Sample meal data:', meals[0]);
      return meals;
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

      // AI-enhanced meal analysis - combine meal name and ingredients
      const mealName = payload.mealName?.toLowerCase() || '';
      const ingredients = payload.description?.toLowerCase() || '';
      const fullDescription = [mealName, ingredients].filter(Boolean).join(', ');
      
      console.log('Analyzing meal:', { mealName, ingredients, fullDescription });
      console.log('User allergens:', userAllergens);
      
      // Extract ingredients using AI + fallback
      const extractedIngredients = await extractIngredients(fullDescription);
      console.log('Extracted ingredients:', extractedIngredients);
      
      // Smart risk assessment
      const riskAnalysis = analyzeIngredientRisk(extractedIngredients, userAllergens);
      const detectedAllergens = riskAnalysis.detectedAllergens;
      
      // Realistic risk scoring (0-100)
      let riskScore = calculateRealisticRiskScore(detectedAllergens, riskAnalysis.hiddenRisks, extractedIngredients);
      
      // Generate contextual advice
      const advice = generateSmartAdvice(detectedAllergens, riskAnalysis.hiddenRisks, riskScore);

      const response: AnalyzeResponse = {
        ingredients: extractedIngredients,
        allergens: detectedAllergens,
        riskScore,
        advice
      };

      console.log('Analysis result:', response);

      // Save meal analysis to Firebase
      const docRef = await addDoc(collection(db, 'meals'), {
        userId: firebaseUser.uid,
        description: fullDescription,
        note: payload.mealName || fullDescription,
        items: response.ingredients,
        ingredients: response.ingredients,
        allergens: response.allergens,
        riskScore: response.riskScore,
        advice: response.advice,
        analysisMethod: extractedIngredients.length > 3 ? 'ai_enhanced' : 'basic',
        hiddenRisks: riskAnalysis.hiddenRisks,
        userAllergens: userAllergens,
        createdAt: new Date().toISOString()
      });
      
      console.log('analyzeMeal: Meal saved with ID:', docRef.id, 'ingredients:', response.ingredients.length);
      
      return response;
    },
    { ingredients: [], allergens: [], riskScore: 0, advice: 'Analysis unavailable' }
  );
};

// Advanced AI-powered ingredient extraction
const extractIngredients = async (description: string): Promise<string[]> => {
  // Try AI analysis first, fallback to pattern matching
  try {
    const aiIngredients = await analyzeWithAI(description);
    if (aiIngredients.length > 0) {
      console.log('AI extracted ingredients:', aiIngredients);
      return aiIngredients;
    }
  } catch (error) {
    console.warn('AI analysis failed, using pattern matching:', error);
  }
  
  // Fallback to enhanced pattern matching
  return extractIngredientsBasic(description);
};

// AI-powered ingredient analysis
const analyzeWithAI = async (description: string): Promise<string[]> => {
  if (!GEMINI_API_KEY) throw new Error('No AI key available');
  
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  const prompt = `Analyze this meal and extract ALL ingredients, including hidden ones. Consider common cooking ingredients and allergens.

Meal: "${description}"

Return ONLY a JSON array of ingredients:
["ingredient1", "ingredient2", "ingredient3"]

Be comprehensive - include base ingredients like flour in bread, milk in cheese, etc.`;

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 512 }
    })
  });

  if (!response.ok) throw new Error('AI API failed');
  
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
  const cleanText = text.replace(/```json|```|`/g, '').trim();
  
  try {
    const parsed = JSON.parse(cleanText);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Extract ingredients from text response
    const matches = cleanText.match(/"([^"]+)"/g);
    return matches ? matches.map((m: string) => m.replace(/"/g, '')) : [];
  }
};

// Enhanced pattern-based extraction (fallback)
const extractIngredientsBasic = (description: string): string[] => {
  const dishPatterns = {
    'pizza': ['wheat', 'flour', 'cheese', 'milk', 'tomato', 'yeast'],
    'pasta': ['wheat', 'flour', 'eggs', 'semolina'],
    'burger': ['wheat', 'flour', 'beef', 'cheese', 'milk', 'lettuce', 'tomato'],
    'sandwich': ['wheat', 'flour', 'bread', 'yeast'],
    'bread': ['wheat', 'flour', 'yeast', 'eggs'],
    'cake': ['wheat', 'flour', 'eggs', 'milk', 'butter', 'sugar'],
    'cookie': ['wheat', 'flour', 'eggs', 'butter', 'milk'],
    'ice cream': ['milk', 'cream', 'eggs', 'sugar'],
    'chocolate': ['cocoa', 'milk', 'soy lecithin'],
    'cheese': ['milk', 'rennet'],
    'yogurt': ['milk', 'cultures'],
    'sushi': ['fish', 'rice', 'seaweed', 'soy sauce'],
    'ramen': ['wheat', 'eggs', 'soy sauce', 'miso'],
    'fried': ['oil', 'wheat', 'flour']
  };
  
  let ingredients: string[] = [];
  
  // Pattern matching with more comprehensive ingredients
  for (const [pattern, patternIngredients] of Object.entries(dishPatterns)) {
    if (description.includes(pattern)) {
      ingredients.push(...patternIngredients);
    }
  }
  
  // Extract explicit ingredients
  const explicitIngredients = description
    .split(/[,;\n]/)
    .map(item => item.trim().toLowerCase())
    .filter(item => item.length > 2);
  
  ingredients.push(...explicitIngredients);
  
  return [...new Set(ingredients)];
};

// Realistic risk scoring system
const calculateRealisticRiskScore = (detectedAllergens: string[], hiddenRisks: string[], ingredients: string[]): number => {
  let score = 5; // Base safe score
  
  // Direct allergen matches (high risk)
  if (detectedAllergens.length > 0) {
    score += detectedAllergens.length * 25; // 25 points per direct allergen
  }
  
  // Hidden allergen risks (medium risk)
  if (hiddenRisks.length > 0) {
    score += hiddenRisks.length * 15; // 15 points per hidden risk
  }
  
  // Complexity factor (more ingredients = slightly higher risk)
  if (ingredients.length > 10) {
    score += 5; // Complex meals have more cross-contamination risk
  }
  
  // Cap at 100
  return Math.min(score, 100);
};

// Smart advice generation
const generateSmartAdvice = (detectedAllergens: string[], hiddenRisks: string[], riskScore: number): string => {
  if (riskScore >= 70) {
    return `⚠️ HIGH RISK: Contains ${detectedAllergens.join(', ')}. Strongly avoid this meal.`;
  } else if (riskScore >= 40) {
    const risks = [...detectedAllergens, ...hiddenRisks];
    return `⚠️ MODERATE RISK: May contain ${risks.join(', ')}. Exercise caution.`;
  } else if (riskScore >= 20) {
    return `⚠️ LOW RISK: Some ingredients need verification. Check preparation methods.`;
  } else {
    return `✅ SAFE: This meal appears safe for your allergen profile.`;
  }
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
      
      // Get meals using the EXACT same logic as getMeals()
      const meals = await getMeals();
      const totalMeals = meals.length;
      
      // Get alerts
      const alertsSnapshot = await getDocs(query(collection(db, 'alerts'), where('userId', '==', firebaseUser.uid)));
      
      const safeMeals = meals.filter(meal => (meal.riskScore || 0) < 40).length;
      const safeMealsPct = totalMeals > 0 ? Math.round((safeMeals / totalMeals) * 100) : 0;
      
      // Calculate average risk score from actual meal data
      const avgRiskScore = totalMeals > 0 
        ? meals.reduce((sum, meal) => sum + (meal.riskScore || 0), 0) / totalMeals
        : 0;
      
      console.log(`getAnalytics: Using getMeals() - Found ${totalMeals} meals, ${safeMeals} safe (${safeMealsPct}%)`);
      console.log('getAnalytics: Sample meal data:', meals[0]);
   
      return {
        totalMeals,
        totalAlerts: alertsSnapshot.size,
        riskScore: Math.round(avgRiskScore * 10) / 10,
        weeklyTrend: [1, 3, 2, 4, 2, 1, 3],
        safeMealsPct,
        weeklyExposure: [
          { week: 'Week 1', count: Math.max(0, Math.floor(totalMeals * 0.2)) },
          { week: 'Week 2', count: Math.max(0, Math.floor(totalMeals * 0.3)) },
          { week: 'Week 3', count: Math.max(0, Math.floor(totalMeals * 0.25)) },
          { week: 'Week 4', count: Math.max(0, Math.floor(totalMeals * 0.25)) }
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
      
      console.log('createMeal: Saving meal with items:', payload.items);
      
      const docRef = await addDoc(collection(db, 'meals'), {
        userId: firebaseUser.uid,
        note: payload.note || 'Manual meal entry',
        description: payload.note || 'Manual meal entry',
        items: payload.items,
        ingredients: payload.items, // Store in both fields for consistency
        riskScore: 5, // Default safe score
        analysisMethod: 'manual',
        createdAt: new Date().toISOString()
      });
      
      console.log('createMeal: Meal saved with ID:', docRef.id);
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