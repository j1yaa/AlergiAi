// Smart AI-powered meal analysis utilities

export interface SmartAnalysisResult {
  confidence: number;
  riskFactors: string[];
  recommendations: string[];
  nutritionalWarnings: string[];
}

// AI-powered risk assessment
export const assessMealRisk = async (
  ingredients: string[], 
  userAllergens: string[], 
  description: string
): Promise<SmartAnalysisResult> => {
  try {
    const { GEMINI_API_KEY } = await import('@env');
    if (!GEMINI_API_KEY) throw new Error('No AI key');
    
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const prompt = `Analyze this meal for allergen risks and provide safety recommendations.

Meal: "${description}"
Detected Ingredients: ${ingredients.join(', ')}
User's Known Allergens: ${userAllergens.join(', ')}

Provide analysis in this JSON format:
{
  "confidence": 85,
  "riskFactors": ["Cross-contamination risk", "Hidden dairy in sauce"],
  "recommendations": ["Ask about preparation methods", "Request allergen-free version"],
  "nutritionalWarnings": ["High sodium", "Contains processed ingredients"]
}

Consider:
- Cross-contamination risks
- Hidden allergens in sauces/seasonings
- Processing methods that introduce allergens
- Restaurant preparation risks`;

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 1024 }
      })
    });

    if (!response.ok) throw new Error('AI analysis failed');
    
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const cleanText = text.replace(/```json|```/g, '').trim();
    
    try {
      return JSON.parse(cleanText);
    } catch {
      return {
        confidence: 60,
        riskFactors: ['Unable to perform detailed analysis'],
        recommendations: ['Exercise caution', 'Check ingredients manually'],
        nutritionalWarnings: []
      };
    }
  } catch (error) {
    console.warn('Smart analysis failed:', error);
    return {
      confidence: 50,
      riskFactors: ['Basic analysis only'],
      recommendations: ['Verify ingredients manually'],
      nutritionalWarnings: []
    };
  }
};

// Learning from user feedback
export const learnFromUserFeedback = (
  mealId: string,
  hadReaction: boolean,
  severity: number,
  symptoms: string[]
) => {
  // Store user feedback for improving future predictions
  const feedback = {
    mealId,
    hadReaction,
    severity,
    symptoms,
    timestamp: new Date().toISOString()
  };
  
  // This could be stored in Firebase for ML training
  console.log('User feedback recorded:', feedback);
  return feedback;
};

// Personalized recommendations based on user history
export const getPersonalizedAdvice = (
  userHistory: any[],
  currentMeal: string[]
): string[] => {
  const advice: string[] = [];
  
  // Analyze user's past reactions
  const problematicIngredients = userHistory
    .filter(meal => meal.hadReaction)
    .flatMap(meal => meal.ingredients);
  
  // Check for patterns
  const commonProblems = [...new Set(problematicIngredients)];
  
  currentMeal.forEach(ingredient => {
    if (commonProblems.includes(ingredient)) {
      advice.push(`⚠️ You've had reactions to ${ingredient} before`);
    }
  });
  
  return advice;
};