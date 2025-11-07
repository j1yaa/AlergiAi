export type MealLog = {
  id: string;
  createdAt: string;      // ISO
  mealName: string;
  ingredients: string[];
  status: 'Safe' | 'Risk';
  note?: string;
};