import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '@env';
import { DEMO_MODE } from '../config/demo';
import { UserProfile, AllergenReponse, AddAllergenRequest, RemoveAllergenRequest } from '../types';

import { 
  User, 
  Meal, 
  AnalyzeRequest, 
  AnalyzeResponse, 
  AlertsResponse, 
  AnalyticsSummary, 
  UserSettings 
} from '../types';
import { 
  mockUser, 
  mockMeals, 
  mockAnalytics, 
  mockUserSettings, 
  getMockAlertsResponse, 
  getMockAnalyzeResponse 
} from './mocks';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token');
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