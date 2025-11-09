import AsyncStorage from '@react-native-async-storage/async-storage';
import { MEALS_KEY, MealEntry } from './mealStorage';

export interface MealAnalytics {
  totalMeals: number;
  safeMeals: number;
  riskMeals: number;
  safePercentage: number;
  weeklyExposure: { week: string; riskCount: number }[];
}

export async function getMealAnalytics(): Promise<MealAnalytics> {
  try {
    const storedMeals = await AsyncStorage.getItem(MEALS_KEY);
    const meals: MealEntry[] = storedMeals ? JSON.parse(storedMeals) : [];
    
    const totalMeals = meals.length;
    const safeMeals = meals.filter(meal => (meal.riskScore || 0) < 50).length;
    const riskMeals = meals.filter(meal => (meal.riskScore || 0) >= 50).length;
    const safePercentage = totalMeals > 0 ? Math.round((safeMeals / totalMeals) * 100) : 0;
    
    // Calculate weekly exposure (last 4 weeks)
    const now = new Date();
    const weeklyExposure = [];
    
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7) - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      const weekMeals = meals.filter(meal => {
        const mealDate = new Date(meal.createdAt);
        return mealDate >= weekStart && mealDate <= weekEnd;
      });
      
      const riskCount = weekMeals.filter(meal => (meal.riskScore || 0) >= 50).length;
      
      weeklyExposure.push({
        week: `Week ${4 - i}`,
        riskCount
      });
    }
    
    return {
      totalMeals,
      safeMeals,
      riskMeals,
      safePercentage,
      weeklyExposure
    };
  } catch (error) {
    console.error('Failed to calculate meal analytics:', error);
    return {
      totalMeals: 0,
      safeMeals: 0,
      riskMeals: 0,
      safePercentage: 0,
      weeklyExposure: []
    };
  }
}