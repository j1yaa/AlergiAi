import { analyzeWithAI } from '../src/data';

describe('AI Meal Analysis', () => {
  test('detects peanuts and calculates high risk', () => {
    const result = analyzeWithAI('peanut butter sandwich with bread');
    
    expect(result.ingredients).toContain('peanuts');
    expect(result.allergens).toContain('peanuts');
    expect(result.riskScore).toBeGreaterThan(20);
    expect(result.advice).toContain('peanuts');
  });

  test('detects multiple allergens', () => {
    const result = analyzeWithAI('shrimp pasta with cheese and eggs');
    
    expect(result.allergens).toContain('shellfish');
    expect(result.allergens).toContain('dairy');
    expect(result.allergens).toContain('eggs');
    expect(result.riskScore).toBeGreaterThan(50);
  });

  test('returns low risk for safe foods', () => {
    const result = analyzeWithAI('grilled chicken with rice and vegetables');
    
    expect(result.ingredients).toContain('chicken');
    expect(result.allergens).toHaveLength(0);
    expect(result.riskScore).toBeLessThan(25);
    expect(result.advice).toContain('safe');
  });

  test('detects tree nuts', () => {
    const result = analyzeWithAI('salad with almonds and walnuts');
    
    expect(result.ingredients).toContain('almonds');
    expect(result.ingredients).toContain('walnuts');
    expect(result.allergens).toContain('tree nuts');
  });

  test('detects gluten in wheat products', () => {
    const result = analyzeWithAI('wheat bread pasta');
    
    expect(result.allergens).toContain('gluten');
    expect(result.ingredients).toContain('wheat');
  });

  test('handles empty description', () => {
    const result = analyzeWithAI('');
    
    expect(result.ingredients).toEqual(['mixed ingredients']);
    expect(result.allergens).toHaveLength(0);
    expect(result.riskScore).toBeLessThan(25);
  });
});