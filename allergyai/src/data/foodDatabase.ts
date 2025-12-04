// Comprehensive food allergen database
export interface FoodItem {
  name: string;
  commonAllergens: string[];
  hiddenAllergens: string[];
  category: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export const FOOD_DATABASE: FoodItem[] = [
  // Dairy products
  { name: 'milk', commonAllergens: ['milk', 'dairy'], hiddenAllergens: ['casein', 'whey', 'lactose'], category: 'dairy', riskLevel: 'high' },
  { name: 'cheese', commonAllergens: ['milk', 'dairy'], hiddenAllergens: ['casein', 'rennet'], category: 'dairy', riskLevel: 'high' },
  { name: 'butter', commonAllergens: ['milk', 'dairy'], hiddenAllergens: ['butterfat'], category: 'dairy', riskLevel: 'medium' },
  
  // Nuts and seeds
  { name: 'peanuts', commonAllergens: ['peanuts'], hiddenAllergens: ['groundnuts', 'arachis oil'], category: 'nuts', riskLevel: 'high' },
  { name: 'almonds', commonAllergens: ['tree nuts', 'almonds'], hiddenAllergens: ['almond extract'], category: 'nuts', riskLevel: 'high' },
  { name: 'walnuts', commonAllergens: ['tree nuts', 'walnuts'], hiddenAllergens: [], category: 'nuts', riskLevel: 'high' },
  
  // Seafood
  { name: 'shrimp', commonAllergens: ['shellfish', 'crustaceans'], hiddenAllergens: ['inosinate'], category: 'seafood', riskLevel: 'high' },
  { name: 'crab', commonAllergens: ['shellfish', 'crustaceans'], hiddenAllergens: [], category: 'seafood', riskLevel: 'high' },
  { name: 'salmon', commonAllergens: ['fish'], hiddenAllergens: ['fish sauce'], category: 'seafood', riskLevel: 'medium' },
  
  // Grains
  { name: 'wheat', commonAllergens: ['wheat', 'gluten'], hiddenAllergens: ['semolina', 'durum', 'spelt'], category: 'grains', riskLevel: 'high' },
  { name: 'barley', commonAllergens: ['gluten'], hiddenAllergens: ['malt', 'malt extract'], category: 'grains', riskLevel: 'medium' },
  
  // Eggs
  { name: 'eggs', commonAllergens: ['eggs'], hiddenAllergens: ['albumin', 'lecithin', 'lysozyme'], category: 'protein', riskLevel: 'high' },
  
  // Soy
  { name: 'soy', commonAllergens: ['soy', 'soya'], hiddenAllergens: ['lecithin', 'tofu', 'tempeh', 'miso'], category: 'legumes', riskLevel: 'medium' },
];

export const findFoodAllergens = (ingredient: string): FoodItem | null => {
  const normalizedIngredient = ingredient.toLowerCase().trim();
  
  return FOOD_DATABASE.find(food => 
    food.name.includes(normalizedIngredient) ||
    normalizedIngredient.includes(food.name) ||
    food.hiddenAllergens.some(hidden => 
      normalizedIngredient.includes(hidden.toLowerCase()) ||
      hidden.toLowerCase().includes(normalizedIngredient)
    )
  ) || null;
};

export const analyzeIngredientRisk = (ingredients: string[], userAllergens: string[]): {
  riskScore: number;
  detectedAllergens: string[];
  hiddenRisks: string[];
} => {
  let riskScore = 0;
  const detectedAllergens: string[] = [];
  const hiddenRisks: string[] = [];
  
  ingredients.forEach(ingredient => {
    const foodItem = findFoodAllergens(ingredient);
    
    if (foodItem) {
      // Check for direct allergen matches
      const matchedAllergens = foodItem.commonAllergens.filter(allergen =>
        userAllergens.some(userAllergen => 
          allergen.toLowerCase().includes(userAllergen.toLowerCase()) ||
          userAllergen.toLowerCase().includes(allergen.toLowerCase())
        )
      );
      
      if (matchedAllergens.length > 0) {
        detectedAllergens.push(...matchedAllergens);
        riskScore += foodItem.riskLevel === 'high' ? 20 : foodItem.riskLevel === 'medium' ? 12 : 6;
      }
      
      // Check for hidden allergens
      const hiddenMatches = foodItem.hiddenAllergens.filter(hidden =>
        userAllergens.some(userAllergen =>
          hidden.toLowerCase().includes(userAllergen.toLowerCase()) ||
          userAllergen.toLowerCase().includes(hidden.toLowerCase())
        )
      );
      
      if (hiddenMatches.length > 0) {
        hiddenRisks.push(...hiddenMatches);
        riskScore += 8;
      }
    }
  });
  
  return {
    riskScore: Math.min(riskScore, 100),
    detectedAllergens: [...new Set(detectedAllergens)],
    hiddenRisks: [...new Set(hiddenRisks)]
  };
};