// Smart AI-powered meal analysis utilities
import { calculateRiskScore, determineExposureLevel, RiskFactors } from './riskCalculator';

export interface RiskScoreResult {
  riskScore: number;            // 0–100
  matchedAllergens: string[];   // allergens found in this meal
  severity: 'LOW' | 'MODERATE' | 'HIGH';
  riskTier: 'Low Risk' | 'Moderate Risk' | 'High Risk';
  explanation?: string;
}

export interface AllergenMatch {
  allergen: string;
  severity: 'low' | 'moderate' | 'high';
  sensitivity?: 'mild' | 'moderate' | 'severe';
}

// Scientific 3-factor weighted risk calculation
export const computeRiskScore = (
  ingredients: string[],
  userAllergens: string[] | AllergenMatch[],
): RiskScoreResult => {
  // Normalize ingredients for matching
  const normalizedIngredients = ingredients.map(i => i.toLowerCase());
  
  // Handle both string array and AllergenMatch array formats
  const allergenMatches: AllergenMatch[] = Array.isArray(userAllergens) && userAllergens.length > 0 && typeof userAllergens[0] === 'object'
    ? userAllergens as AllergenMatch[]
    : (userAllergens as string[]).map(allergen => ({
        allergen: allergen.toLowerCase(),
        severity: 'moderate' as const,
        sensitivity: 'moderate' as const
      }));

  const matchedAllergens: string[] = [];
  let maxRiskScore = 0;
  let riskExplanation = '';

  // Calculate risk for each matched allergen
  allergenMatches.forEach(({ allergen, severity, sensitivity = 'moderate' }) => {
    const isMatched = normalizedIngredients.some(ing => ing.includes(allergen));
    
    if (isMatched) {
      matchedAllergens.push(allergen);
      
      // Determine exposure level based on ingredient position
      const exposure = determineExposureLevel(allergen, ingredients);
      
      // Calculate risk using the scientific model
      const riskFactors: RiskFactors = {
        severity,
        exposure,
        sensitivity
      };
      
      const riskResult = calculateRiskScore(riskFactors);
      
      // Track the highest risk score
      if (riskResult.normalizedScore > maxRiskScore) {
        maxRiskScore = riskResult.normalizedScore;
        riskExplanation = riskResult.explanation;
      }
    }
  });

  // If no allergens matched, return low risk
  if (matchedAllergens.length === 0) {
    return {
      riskScore: 5,
      matchedAllergens: [],
      severity: 'LOW',
      riskTier: 'Low Risk',
      explanation: 'No known allergens detected in ingredients.'
    };
  }

  // Determine severity based on final score
  let severity: RiskScoreResult['severity'];
  let riskTier: RiskScoreResult['riskTier'];
  
  if (maxRiskScore <= 30) {
    severity = 'LOW';
    riskTier = 'Low Risk';
  } else if (maxRiskScore <= 70) {
    severity = 'MODERATE';
    riskTier = 'Moderate Risk';
  } else {
    severity = 'HIGH';
    riskTier = 'High Risk';
  }

  return {
    riskScore: maxRiskScore,
    matchedAllergens,
    severity,
    riskTier,
    explanation: riskExplanation
  };
};

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

    const API_URL =
      `https://generativelanguage.googleapis.com/v1beta/models/` +
      `gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

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
        generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
      }),
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
        nutritionalWarnings: [],
      };
    }
  } catch (error) {
    console.warn('Smart analysis failed:', error);
    return {
      confidence: 50,
      riskFactors: ['Basic analysis only'],
      recommendations: ['Verify ingredients manually'],
      nutritionalWarnings: [],
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
    timestamp: new Date().toISOString(),
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
