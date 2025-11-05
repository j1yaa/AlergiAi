import axios from 'axios';
import { API_BASE_URL } from '@env';
import { DEMO_MODE } from '../config/demo';
import { storage } from '../utils/storage';
import { UserProfile, AllergensResponse, AddAllergenRequest, RemoveAllergenRequest } from '../types';

import { 
  User, 
  Meal, 
  AnalyzeRequest, 
  AnalyzeResponse, 
  AlertsResponse, 
  AnalyticsSummary, 
  UserSettings,
  Symptom,
  SymptomsResponse,
  SymptomAnalytics
} from '../types';
import { 
  mockUser, 
  mockMeals, 
  mockAnalytics, 
  mockUserSettings, 
  getMockAlertsResponse, 
  getMockAnalyzeResponse,
  getMockSymptomsResponse,
  mockSymptomAnalytics
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

export const login = async (credentials: { email: string; password: string }) => {
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
  return handleApiCall(
    async () => {
      const response = await api.post('/symptoms', symptom);
      return response.data;
    },
    { ...symptom, id: `symptom-${Date.now()}` }
  );
};

export const getSymptoms = async (): Promise<SymptomsResponse> => {
  return handleApiCall(
    async () => {
      const response = await api.get('/symptoms');
      return response.data;
    },
    getMockSymptomsResponse()
  );
};

export const getSymptomAnalytics = async (): Promise<SymptomAnalytics> => {
  return handleApiCall(
    async () => {
      const response = await api.get('/analytics/symptoms');
      return response.data;
    },
    mockSymptomAnalytics
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