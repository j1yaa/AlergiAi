import { Router } from 'express';
import { mockUser, mockMeals, mockAlerts, mockAnalytics, mockUserSettings, validateUser, createUser, analyzeWithAI } from './data';
import { AnalyzeRequest, AnalyzeResponse, AlertsResponse, RegisterRequest, LoginRequest, AuthResponse } from './types';

const router = Router();

// Auth routes
router.post('/auth/register', (req, res) => {
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
  
  const newUser = createUser(name, email, password, allergens);
  if (!newUser) {
    return res.status(409).json({ error: 'User already exists' });
  }
  
  const response: AuthResponse = {
    token: `jwt.${newUser.id}.${Date.now()}`,
    user: { id: newUser.id, name: newUser.name, email: newUser.email }
  };
  
  res.status(201).json(response);
});

router.post('/auth/login', (req, res) => {
  const { email, password }: LoginRequest = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  
  const user = validateUser(email, password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  
  const response: AuthResponse = {
    token: `jwt.${user.id}.${Date.now()}`,
    user: { id: user.id, name: user.name, email: user.email }
  };
  
  res.json(response);
});

// Meals routes
router.get('/meals', (req, res) => {
  res.json(mockMeals);
});

router.post('/meals/analyze', (req, res) => {
  const { description, imageBase64 }: AnalyzeRequest = req.body;
  
  if (!description && !imageBase64) {
    return res.status(400).json({ error: 'Description or image is required' });
  }
  
  // Use AI analysis for description
  let response: AnalyzeResponse;
  if (description) {
    response = analyzeWithAI(description);
  } else {
    // Simulate image analysis
    response = {
      ingredients: ['mixed ingredients'],
      allergens: ['unknown'],
      riskScore: 50,
      advice: 'Image analysis not fully implemented. Please provide a text description for accurate results.'
    };
  }
  
  res.json(response);
});

// Alerts routes
router.get('/alerts', (req, res) => {
  const status = req.query.status as string || 'all';
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  
  let filteredAlerts = mockAlerts;
  if (status === 'flagged') {
    filteredAlerts = mockAlerts.filter(alert => alert.severity === 'high' || alert.severity === 'medium');
  }
  
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedAlerts = filteredAlerts.slice(startIndex, endIndex);
  
  const response: AlertsResponse = {
    items: paginatedAlerts,
    page,
    pageSize,
    total: filteredAlerts.length
  };
  
  res.json(response);
});

// Analytics routes
router.get('/analytics/summary', (req, res) => {
  res.json(mockAnalytics);
});

// User settings routes
router.get('/user/settings', (req, res) => {
  res.json(mockUserSettings);
});

router.put('/user/settings', (req, res) => {
  res.json(req.body);
});

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;