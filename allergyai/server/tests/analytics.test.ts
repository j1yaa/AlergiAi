import { mockAnalytics } from '../src/data';

describe('Analytics', () => {
  test('analytics summary has required keys', () => {
    expect(mockAnalytics).toHaveProperty('safeMealsPct');
    expect(mockAnalytics).toHaveProperty('weeklyExposure');
    expect(mockAnalytics).toHaveProperty('topAllergens');
    expect(Array.isArray(mockAnalytics.weeklyExposure)).toBe(true);
    expect(Array.isArray(mockAnalytics.topAllergens)).toBe(true);
  });
});