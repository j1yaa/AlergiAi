import { Router } from 'express';
import { mockUser, mockMeals, mockAlerts, mockAnalytics, mockUserSettings, mockSymptoms, mockSymptomAnalytics } from './data';
import { AnalyzeRequest, AnalyzeResponse, AlertsResponse, SymptomsResponse, Symptom } from './types';

const router = Router();

// Auth routes
router.post('/auth/login', (req, res) => {
  res.json({
    token: 'demo.jwt.token',
    user: mockUser
  });
});

// Meals routes
router.get('/meals', (req, res) => {
  res.json(mockMeals);
});

router.post('/meals/analyze', (req, res) => {
  const { description, imageBase64 }: AnalyzeRequest = req.body;
  
  const response: AnalyzeResponse = {
    ingredients: ['chicken', 'lettuce', 'tomatoes'],
    allergens: description?.toLowerCase().includes('peanut') ? ['peanuts'] : [],
    riskScore: description?.toLowerCase().includes('peanut') ? 85 : 15,
    advice: description?.toLowerCase().includes('peanut') 
      ? 'High allergen risk detected. Avoid this meal.' 
      : 'This meal appears safe for your dietary restrictions.'
  };
  
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