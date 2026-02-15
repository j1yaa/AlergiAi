export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  allergens: string[];
}

export interface Meal {
  id: string;
  userId?: string;
  timeStamp?: Date;
  notes?: string;
  photoURL?: string;
  items: string[];
  dateISO?: string;
  description?: string;
  ingredients?: string[];
  allergens?: string[];
  createdAt?: string;
  note?: string;
}

export interface Alert {
  id: string;
  mealId: string;
  dateISO: string;
  allergens: string[];
  severity: 'low' | 'medium' | 'high';
  note: string;
  userId?: string;
  message?: string;
  type?: string;
  timestamp?: Date;
  read?: boolean;
  triggered?: boolean;
}

export interface AnalyticsSummary {
  totalMeals?: number;
  totalAlerts?: number;
  riskScore?: number;
  weeklyTrend?: number[];
  safeMealsPct: number;
  weeklyExposure: { week: string; count: number }[];
  topAllergens: { name: string; count: number }[];
}

export interface AnalyzeRequest {
  description?: string;
  imageBase64?: string;
}

export interface AnalyzeResponse {
  ingredients: string[];
  allergens: string[];
  riskScore: number;
  advice: string;
}

export interface UserSettings {
  userId?: string;
  name: string;
  email: string;
  allergens: string[];
  diet: string;
  notifications: boolean;
  notificationTimes?: any[];
  reminderEnabled?: boolean;
  theme?: string;
  language?: string;
}

export interface AlertsResponse {
  items: Alert[];
  page: number;
  pageSize: number;
  total: number;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  allergens?: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Symptom {
  id: string;
  dateISO: string;
  description: string;
  severity: number;  // 1-5 scale
}

export interface SymptomsResponse {
  items: Symptom[];
  page: number;
  pageSize: number;
  total: number;
}

export interface SymptomAnalytics {
  avgSeverity: number;
  weeklySymptoms: { week: string; count: number; avgSeverity: number }[];
  commonSymptoms: { description: string; count: number }[];
}

export interface UserProfile {
    id: string;
    name: string;
    email: string;
    allergens: string[];
    totalMeals: number;
    totalAlerts: number;
    createdAt: string;
}



export interface AddAllergenRequest {
    allergen: string;
    severity?: 'low' | 'moderate' | 'high';
}

export interface RemoveAllergenRequest {
    allergen: string;
}

export interface AllergenWithSeverity {
    name: string;
    severity: 'low' | 'moderate' | 'high';
}

export interface AllergensResponse {
    allergens: string[];
    allergensSeverity?: AllergenWithSeverity[];
}