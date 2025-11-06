import { Router } from 'express';
import { analyzeWithAI } from './data';
import { AnalyzeRequest, AnalyzeResponse, AlertsResponse, RegisterRequest, LoginRequest, AuthResponse } from './types';
import { createUser, findUserByEmail, validateUser, createMeal, createAlert, getUserMeals, getUserAlerts } from './database';
import jwt from 'jsonwebtoken';
import { mockUser, mockMeals, mockAlerts, mockAnalytics, mockUserSettings, mockSymptoms, mockSymptomAnalytics } from './data';
import { AnalyzeRequest, AnalyzeResponse, AlertsResponse, SymptomsResponse, Symptom } from './types';

const router = Router();

// Auth routes
router.post('/auth/register', async (req, res) => 
  try {
    const { name, email, password, allergens = [] }: RegisterRequest = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }
    
    const newUser = await createUser(name, email, password, allergens);
    
    const token = jwt.sign({ userId: newUser.id }, process.env.JWT_SECRET || 'demo-secret', { expiresIn: '7d' });
    
    const response: AuthResponse = {
      token,
      user: { id: newUser.id, name: newUser.name, email: newUser.email }
    };
    
    res.status(201).json(response);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const { email, password }: LoginRequest = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const user = await validateUser(email, password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'demo-secret', { expiresIn: '7d' });
    
    const response: AuthResponse = {
      token,
      user: { id: user.id, name: user.name, email: user.email }
    };
    
    res.json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Meals routes
router.get('/meals', async (req, res) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const meals = await getUserMeals(userId);
    const formattedMeals = meals.map((meal: any) => ({
      id: meal.id,
      dateISO: meal.createdAt.toISOString(),
      description: meal.description,
      ingredients: JSON.parse(meal.ingredients)
    }));
    
    res.json(formattedMeals);
  } catch (error) {
    console.error('Get meals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/meals/analyze', async (req, res) => {
  try {
    const { description, imageBase64 }: AnalyzeRequest = req.body;
    const userId = (req as any).userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    if (!description && !imageBase64) {
      return res.status(400).json({ error: 'Description or image is required' });
    }
    
    // Use AI analysis for description
    let analysis: AnalyzeResponse;
    if (description) {
      analysis = analyzeWithAI(description);
    } else {
      // Simulate image analysis
      analysis = {
        ingredients: ['mixed ingredients'],
        allergens: ['unknown'],
        riskScore: 50,
        advice: 'Image analysis not fully implemented. Please provide a text description for accurate results.'
      };
    }
    
    // Save meal to database
    const meal = await createMeal(userId, description || 'Image upload', analysis);
    
    // Create alert if high risk
    if (analysis.riskScore > 50 && analysis.allergens.length > 0) {
      await createAlert(
        userId,
        meal.id,
        analysis.riskScore > 80 ? 'high' : 'medium',
        analysis.allergens,
        analysis.advice
      );
    }
    
    res.json(analysis);
  } catch (error) {
    console.error('Analyze meal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Alerts routes
router.get('/alerts', async (req, res) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const status = req.query.status as string || 'all';
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    
    const { alerts, total } = await getUserAlerts(userId, status, page, pageSize);
    
    const formattedAlerts = alerts.map((alert: any) => ({
      id: alert.id,
      mealId: alert.mealId,
      dateISO: alert.createdAt.toISOString(),
      allergens: JSON.parse(alert.allergens),
      severity: alert.severity,
      note: alert.note
    }));
    
    const response: AlertsResponse = {
      items: formattedAlerts,
      page,
      pageSize,
      total
    };
    
    res.json(response);
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Analytics routes
router.get('/analytics/summary', async (req, res) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Simple analytics - can be enhanced later
    const mockAnalytics = {
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
    
    res.json(mockAnalytics);
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User settings routes
router.get('/user/settings', async (req, res) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const user = await findUserByEmail((req as any).userEmail);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const settings = {
      allergens: JSON.parse(user.allergens || '[]'),
      diet: 'Mediterranean',
      notifications: true
    };
    
    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/user/settings', async (req, res) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // For now, just return the body - can implement actual updates later
    res.json(req.body);
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Symptoms routes
router.get('/symptoms', (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedSymptoms = mockSymptoms.slice(startIndex, endIndex);
  
  const response: SymptomsResponse = {
    items: paginatedSymptoms,
    page,
    pageSize,
    total: mockSymptoms.length
  };
  
  res.json(response);
});

router.post('/symptoms', (req, res) => {
  const { description, severity, dateISO } = req.body;
  
  const newSymptom: Symptom = {
    id: `symptom-${Date.now()}`,
    description,
    severity,
    dateISO
  };
  
  mockSymptoms.unshift(newSymptom);
  res.json(newSymptom);
});

router.get('/analytics/symptoms', (req, res) => {
  res.json(mockSymptomAnalytics);
});

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;