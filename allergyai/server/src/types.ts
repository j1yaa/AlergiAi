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
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface AlertsResponse {
  items: Alert[];
  page: number;
  pageSize: number;
  total: number;
}

export interface Alert {
  id: string;
  mealId: string;
  dateISO: string;
  allergens: string[];
  severity: string;
  note: string;
}

export interface SymptomsResponse {
  items: Symptom[];
  page: number;
  pageSize: number;
  total: number;
}

export interface Symptom {
  id: string;
  description: string;
  severity: number;
  dateISO: string;
}