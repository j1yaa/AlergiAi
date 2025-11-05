export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Meal {
  id: string;
  dateISO: string;
  description: string;
  ingredients: string[];
}

export interface Alert {
  id: string;
  mealId: string;
  dateISO: string;
  allergens: string[];
  severity: 'low' | 'medium' | 'high';
  note: string;
}

export interface AnalyticsSummary {
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
  allergens: string[];
  diet: string;
  notifications: boolean;
}

export interface AlertsResponse {
  items: Alert[];
  page: number;
  pageSize: number;
  total: number;
}

export interface Symptom {
  id: string;
  dateISO: string;
  description: string;
  severity: number;
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