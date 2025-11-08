import { User, Meal, Alert, AnalyticsSummary, UserSettings, Symptom } from './types';

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

// In-memory user database
export const users: { [email: string]: { id: string; name: string; email: string; password: string; allergens: string[] } } = {
  'john@example.com': {
    id: 'user-123',
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password',
    allergens: ['peanuts', 'shellfish']
  },
  'jane@example.com': {
    id: 'user-456',
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: 'password123',
    allergens: ['dairy', 'gluten']
  }
};

export const validateUser = (email: string, password: string) => {
  const user = users[email];
  return user && user.password === password ? user : null;
};

export const createUser = (name: string, email: string, password: string, allergens: string[] = []) => {
  if (users[email]) {
    return null; // User already exists
  }
  
  const newUser = {
    id: `user-${Date.now()}`,
    name,
    email,
    password,
    allergens
  };
  
  users[email] = newUser;
  return newUser;
};

// AI-powered meal analysis
export const analyzeWithAI = (description: string) => {
  const lowerDesc = description.toLowerCase();
  
  // Simple AI simulation - detect ingredients and allergens
  const ingredientPatterns = {
    'chicken': ['chicken', 'poultry'],
    'beef': ['beef', 'steak', 'burger'],
    'pork': ['pork', 'bacon', 'ham'],
    'fish': ['fish', 'salmon', 'tuna', 'cod'],
    'shrimp': ['shrimp', 'prawns'],
    'crab': ['crab'],
    'lobster': ['lobster'],
    'peanuts': ['peanut', 'peanuts'],
    'almonds': ['almond', 'almonds'],
    'walnuts': ['walnut', 'walnuts'],
    'cashews': ['cashew', 'cashews'],
    'milk': ['milk', 'dairy'],
    'cheese': ['cheese'],
    'butter': ['butter'],
    'eggs': ['egg', 'eggs'],
    'wheat': ['wheat', 'bread', 'pasta'],
    'soy': ['soy', 'tofu'],
    'sesame': ['sesame']
  };
  
  const allergenMap = {
    'peanuts': 'peanuts',
    'almonds': 'tree nuts',
    'walnuts': 'tree nuts',
    'cashews': 'tree nuts',
    'shrimp': 'shellfish',
    'crab': 'shellfish',
    'lobster': 'shellfish',
    'milk': 'dairy',
    'cheese': 'dairy',
    'butter': 'dairy',
    'eggs': 'eggs',
    'wheat': 'gluten',
    'soy': 'soy',
    'sesame': 'sesame'
  };
  
  const detectedIngredients: string[] = [];
  const detectedAllergens: string[] = [];
  
  Object.entries(ingredientPatterns).forEach(([ingredient, patterns]) => {
    if (patterns.some(pattern => lowerDesc.includes(pattern))) {
      detectedIngredients.push(ingredient);
      if (allergenMap[ingredient as keyof typeof allergenMap]) {
        const allergen = allergenMap[ingredient as keyof typeof allergenMap];
        if (!detectedAllergens.includes(allergen)) {
          detectedAllergens.push(allergen);
        }
      }
    }
  });
  
  // Calculate risk score based on allergens
  const riskScore = detectedAllergens.length > 0 ? Math.min(detectedAllergens.length * 25 + Math.random() * 20, 100) : Math.random() * 20;
  
  let advice = 'This meal appears safe for most dietary restrictions.';
  if (detectedAllergens.length > 0) {
    advice = `⚠️ Contains ${detectedAllergens.join(', ')}. Check ingredients carefully if you have these allergies.`;
  }
  if (riskScore > 70) {
    advice = `🚨 High allergen risk detected! This meal contains multiple allergens: ${detectedAllergens.join(', ')}. Avoid if allergic.`;
  }
  
  return {
    ingredients: detectedIngredients.length > 0 ? detectedIngredients : ['mixed ingredients'],
    allergens: detectedAllergens,
    riskScore: Math.round(riskScore),
    advice
  };
};

export const mockSymptoms: Symptom[] = [
  {
    id: 'symptom-1',
    dateISO: '2024-01-15T14:30:00Z',
    description: 'Mild stomach discomfort after lunch',
    severity: 2
  },
  {
    id: 'symptom-2',
    dateISO: '2024-01-14T09:15:00Z',
    description: 'Skin rash on arms',
    severity: 4
  },
  {
    id: 'symptom-3',
    dateISO: '2024-01-13T16:45:00Z',
    description: 'Headache and nausea',
    severity: 3
  },
  {
    id: 'symptom-4',
    dateISO: '2024-01-12T11:20:00Z',
    description: 'Itchy throat after eating',
    severity: 3
  },
  {
    id: 'symptom-5',
    dateISO: '2024-01-11T18:00:00Z',
    description: 'Mild bloating',
    severity: 1
  }
];

let symptomIdCounter = mockSymptoms.length + 1;

