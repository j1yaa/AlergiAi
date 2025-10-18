import { User, Meal, Alert, AnalyticsSummary, UserSettings } from './types';

export const mockUser: User = {
  id: 'user-123',
  name: 'John Doe',
  email: 'john@example.com'
};

export const mockMeals: Meal[] = [
  {
    id: 'meal-1',
    dateISO: '2024-01-15T12:30:00Z',
    description: 'Grilled chicken salad with mixed greens',
    ingredients: ['chicken', 'lettuce', 'tomatoes', 'cucumber', 'olive oil']
  },
  {
    id: 'meal-2',
    dateISO: '2024-01-15T08:00:00Z',
    description: 'Peanut butter toast with banana',
    ingredients: ['bread', 'peanut butter', 'banana']
  },
  {
    id: 'meal-3',
    dateISO: '2024-01-14T19:00:00Z',
    description: 'Shrimp pasta with garlic sauce',
    ingredients: ['pasta', 'shrimp', 'garlic', 'olive oil', 'parsley']
  },
  {
    id: 'meal-4',
    dateISO: '2024-01-14T13:15:00Z',
    description: 'Turkey sandwich with cheese',
    ingredients: ['bread', 'turkey', 'cheese', 'lettuce', 'mayo']
  },
  {
    id: 'meal-5',
    dateISO: '2024-01-13T20:30:00Z',
    description: 'Salmon with almonds and rice',
    ingredients: ['salmon', 'almonds', 'rice', 'broccoli']
  }
];

export const mockAlerts: Alert[] = [
  {
    id: 'alert-1',
    mealId: 'meal-2',
    dateISO: '2024-01-15T08:05:00Z',
    allergens: ['peanuts'],
    severity: 'high',
    note: 'High peanut content detected in meal'
  },
  {
    id: 'alert-2',
    mealId: 'meal-3',
    dateISO: '2024-01-14T19:05:00Z',
    allergens: ['shellfish'],
    severity: 'medium',
    note: 'Shellfish allergen detected'
  },
  {
    id: 'alert-3',
    mealId: 'meal-4',
    dateISO: '2024-01-14T13:20:00Z',
    allergens: ['dairy'],
    severity: 'low',
    note: 'Dairy content in cheese'
  },
  {
    id: 'alert-4',
    mealId: 'meal-5',
    dateISO: '2024-01-13T20:35:00Z',
    allergens: ['tree nuts'],
    severity: 'medium',
    note: 'Tree nuts (almonds) detected'
  },
  {
    id: 'alert-5',
    mealId: 'meal-1',
    dateISO: '2024-01-15T12:35:00Z',
    allergens: [],
    severity: 'low',
    note: 'Safe meal - no allergens detected'
  },
  {
    id: 'alert-6',
    mealId: 'meal-2',
    dateISO: '2024-01-15T08:10:00Z',
    allergens: ['gluten'],
    severity: 'medium',
    note: 'Gluten detected in bread'
  }
];

export const mockAnalytics: AnalyticsSummary = {
  safeMealsPct: 75,
  weeklyExposure: [
    { week: 'Week 1', count: 2 },
    { week: 'Week 2', count: 4 },
    { week: 'Week 3', count: 1 },
    { week: 'Week 4', count: 3 }
  ],
  topAllergens: [
    { name: 'Peanuts', count: 8 },
    { name: 'Dairy', count: 6 },
    { name: 'Shellfish', count: 4 },
    { name: 'Tree Nuts', count: 3 },
    { name: 'Gluten', count: 2 }
  ]
};

export const mockUserSettings: UserSettings = {
  allergens: ['peanuts', 'shellfish', 'dairy'],
  diet: 'Mediterranean',
  notifications: true
};