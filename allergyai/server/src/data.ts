import { AnalyzeResponse } from './types';

export const analyzeWithAI = (description: string): AnalyzeResponse => {
  const commonAllergens = ['peanuts', 'dairy', 'shellfish', 'eggs', 'soy', 'wheat', 'tree nuts', 'fish'];
  const foundAllergens = commonAllergens.filter(allergen => 
    description.toLowerCase().includes(allergen)
  );
  
  return {
    ingredients: description.split(',').map(i => i.trim()),
    allergens: foundAllergens,
    riskScore: foundAllergens.length > 0 ? Math.min(foundAllergens.length * 25, 100) : 10,
    advice: foundAllergens.length > 0 
      ? `Warning: Contains ${foundAllergens.join(', ')}. Please check ingredients carefully.`
      : 'No known allergens detected, but always verify ingredients.'
  };
};