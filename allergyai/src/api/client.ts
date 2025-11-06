import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@env';
import { DEMO_MODE } from '../config/demo';
import { storage } from '../utils/storage';
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

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
});

api.interceptors.request.use(async (config) => {
  const token = await storage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const handleApiCall = async <T>(apiCall: () => Promise<T>, mockData: T): Promise<T> => {
  try {
    const response = await apiCall();
    return response;
  } catch (error) {
    if (DEMO_MODE) {
      console.warn('API call failed, using mock data');
      return mockData;
    }
    throw error;
  }
};

export const register = async (userData: RegisterRequest): Promise<AuthResponse> => {
  return handleApiCall(
    async () => {
      const response = await api.post('/auth/register', userData);
      return response.data;
    },
    { token: 'demo.jwt.token', user: { ...mockUser, name: userData.name, email: userData.email } }
  );
};

export const login = async (credentials: LoginRequest): Promise<AuthResponse> => {
  return handleApiCall(
    async () => {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    },
    { token: 'demo.jwt.token', user: mockUser }
  );
};

export const getMeals = async (): Promise<Meal[]> => {
  return handleApiCall(
    async () => {
      const response = await api.get('/meals');
      return response.data;
    },
    mockMeals
  );
};

export const analyzeMeal = async (payload: AnalyzeRequest): Promise<AnalyzeResponse> => {
  return handleApiCall(
    async () => {
      const response = await api.post('/meals/analyze', payload);
      return response.data;
    },
    getMockAnalyzeResponse(payload.description)
  );
};

export const getAlerts = async (params?: { status?: string; page?: number; pageSize?: number }): Promise<AlertsResponse> => {
  return handleApiCall(
    async () => {
      const response = await api.get('/alerts', { params });
      return response.data;
    },
    getMockAlertsResponse(params?.status)
  );
};

export const getAnalytics = async (): Promise<AnalyticsSummary> => {
  return handleApiCall(
    async () => {
      const response = await api.get('/analytics/summary');
      return response.data;
    },
    mockAnalytics
  );
};

export const getUserSettings = async (): Promise<UserSettings> => {
  return handleApiCall(
    async () => {
      const response = await api.get('/user/settings');
      return response.data;
    },
    mockUserSettings
  );
};

export const updateUserSettings = async (settings: UserSettings): Promise<UserSettings> => {
  return handleApiCall(
    async () => {
      const response = await api.put('/user/settings', settings);
      return response.data;
    },
    settings
  );
};

export const saveSymptom = async (symptom: Omit<Symptom, 'id'>): Promise<Symptom> => {
  const newSymptom = { ...symptom, id: `symptom-${Date.now()}` };
  
  if (DEMO_MODE) {
    // In demo mode, save to AsyncStorage
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
  
  return handleApiCall(
    async () => {
      const response = await api.post('/symptoms', symptom);
      return response.data;
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
  
  return handleApiCall(
    async () => {
      const response = await api.get('/symptoms');
      return response.data;
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
  
  return handleApiCall(
    async () => {
      const response = await api.get('/analytics/symptoms');
      return response.data;
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
    return handleApiCall(
        async () => {
            const response = await api.get('/profile');
            return response.data;
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
    return handleApiCall(
        async () => {
            const response = await api.get('/allergens');
            return response.data;
        },
        {
            allergens: ['Peanuts', 'Shellfish', 'Dairy'],
        }
    );
};

export const addAllergen = async (data: AddAllergenRequest): Promise<void> => {
    return handleApiCall(
        async () => {
            const response = await api.post('/allergens', data);
            return response.data;
        },
        undefined as void
    );
};

export const removeAllergen = async (data: RemoveAllergenRequest): Promise<void> => {
    return handleApiCall(
        async () => {
            const response = await api.delete('/allergens', { data });
            return response.data;
        },
        undefined as void
    );
};

const MEALS_KEY = "meals";

// Save a new meal
export async function createMeal(payload: { items: string[]; note?: string }): Promise<Meal> {
  const newMeal: Meal = {
    id: `meal-${Date.now()}`,
    items: payload.items,
    note: payload.note,
    createdAt: new Date().toISOString(),
  };

  const existingRaw = await AsyncStorage.getItem(MEALS_KEY);
  const existing: Meal[] = existingRaw ? JSON.parse(existingRaw) : [];

  await AsyncStorage.setItem(MEALS_KEY, JSON.stringify([newMeal, ...existing]));
  return newMeal;
}
