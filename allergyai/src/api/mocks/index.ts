import { User, Meal, Alert, AnalyticsSummary, UserSettings, AlertsResponse, AnalyzeResponse } from '../../types';

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
    mealId: 'meal-1',
    dateISO: '2024-01-15T12:35:00Z',
    allergens: [],
    severity: 'low',
    note: 'Safe meal - no allergens detected'
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
    { name: 'Shellfish', count: 4 }
  ]
};

export const mockUserSettings: UserSettings = {
  allergens: ['peanuts', 'shellfish', 'dairy'],
  diet: 'Mediterranean',
  notifications: true
};

export const getMockAlertsResponse = (status?: string): AlertsResponse => ({
  items: status === 'flagged' ? mockAlerts.filter(a => a.severity !== 'low') : mockAlerts,
  page: 1,
  pageSize: 20,
  total: mockAlerts.length
});

export const getMockAnalyzeResponse = (description?: string): AnalyzeResponse => ({
  ingredients: ['chicken', 'lettuce', 'tomatoes'],
  allergens: description?.toLowerCase().includes('peanut') ? ['peanuts'] : [],
  riskScore: description?.toLowerCase().includes('peanut') ? 85 : 15,
  advice: description?.toLowerCase().includes('peanut') 
    ? 'High allergen risk detected. Avoid this meal.' 
    : 'This meal appears safe for your dietary restrictions.'
});