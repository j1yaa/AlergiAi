// Scientific risk calculation utilities

export interface RiskFactors {
  severity: 'low' | 'moderate' | 'high';
  exposure: 'trace' | 'low' | 'high';
  sensitivity: 'mild' | 'moderate' | 'severe';
}

export interface RiskCalculationResult {
  rawScore: number;
  normalizedScore: number;
  riskTier: 'Low Risk' | 'Moderate Risk' | 'High Risk';
  explanation: string;
}

/**
 * Calculate risk score using the 3-factor weighted model
 * @param factors - The three risk factors
 * @returns Detailed risk calculation result
 */
export const calculateRiskScore = (factors: RiskFactors): RiskCalculationResult => {
  // Assign standardized weights
  const severityWeight = factors.severity === 'low' ? 1 : factors.severity === 'moderate' ? 2 : 3;
  const exposureWeight = factors.exposure === 'trace' ? 1 : factors.exposure === 'low' ? 2 : 3;
  const sensitivityWeight = factors.sensitivity === 'mild' ? 1 : factors.sensitivity === 'moderate' ? 2 : 3;

  // Compute raw score (1-27 range)
  const rawScore = severityWeight * exposureWeight * sensitivityWeight;

  // Normalize to 0-100% scale
  const normalizedScore = Math.round((rawScore / 27) * 100);

  // Determine risk tier
  let riskTier: 'Low Risk' | 'Moderate Risk' | 'High Risk';
  if (normalizedScore <= 30) {
    riskTier = 'Low Risk';
  } else if (normalizedScore <= 70) {
    riskTier = 'Moderate Risk';
  } else {
    riskTier = 'High Risk';
  }

  // Generate explanation
  const explanation = `Risk calculated from: ${factors.severity} allergen severity (${severityWeight}), ${factors.exposure} exposure level (${exposureWeight}), ${factors.sensitivity} user sensitivity (${sensitivityWeight}). Raw score: ${rawScore}/27.`;

  return {
    rawScore,
    normalizedScore,
    riskTier,
    explanation
  };
};

/**
 * Determine exposure level based on ingredient list position and frequency
 * @param allergen - The allergen to check
 * @param ingredients - List of ingredients
 * @returns Exposure level
 */
export const determineExposureLevel = (allergen: string, ingredients: string[]): 'trace' | 'low' | 'high' => {
  const { expandAllergen } = require('./allergenMatcher');
  const normalizedIngredients = ingredients.map(i => i.toLowerCase());
  const expandedTerms = (expandAllergen(allergen) as string[]).map((t: string) => t.toLowerCase());

  // Find all occurrences using expanded allergen terms
  const matches = normalizedIngredients.filter(ing =>
    expandedTerms.some(term => ing.includes(term) || term.includes(ing))
  );
  const firstMatchIndex = normalizedIngredients.findIndex(ing =>
    expandedTerms.some(term => ing.includes(term) || term.includes(ing))
  );

  if (matches.length === 0) return 'trace';

  // High exposure: appears multiple times OR appears in first 3 ingredients
  if (matches.length > 1 || firstMatchIndex <= 2) {
    return 'high';
  }

  // Low exposure: appears in first half of ingredient list
  if (firstMatchIndex <= normalizedIngredients.length / 2) {
    return 'low';
  }

  // Trace: appears later in ingredient list
  return 'trace';
};

/**
 * Get risk color based on risk tier
 * @param riskTier - The risk tier
 * @returns Color code
 */
export const getRiskColor = (riskTier: 'Low Risk' | 'Moderate Risk' | 'High Risk'): string => {
  switch (riskTier) {
    case 'Low Risk':
      return '#4CAF50';
    case 'Moderate Risk':
      return '#FF9800';
    case 'High Risk':
      return '#f44336';
    default:
      return '#666';
  }
};

/**
 * Get severity color based on severity level
 * @param severity - The severity level
 * @returns Color code
 */
export const getSeverityColor = (severity: 'low' | 'moderate' | 'high'): string => {
  switch (severity) {
    case 'low':
      return '#4CAF50';
    case 'moderate':
      return '#FF9800';
    case 'high':
      return '#f44336';
    default:
      return '#666';
  }
};