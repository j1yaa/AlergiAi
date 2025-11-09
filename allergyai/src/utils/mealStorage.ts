export const MEALS_KEY = '@meals/v1';

export type MealEntry = {
  id: string;
  name: string;
  ingredients: string[]; // array, not a comma string
  note?: string;
  riskScore?: number;
  createdAt: string;     // ISO string
};