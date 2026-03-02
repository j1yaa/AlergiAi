import { Symptom, Meal } from '../types';
import {computeRiskScore } from './smartAnalyzer';
import { RISKTHRES } from './riskConstants';
interface PredictionResult {
    allergen: string;
    riskScore: number;
    confidence: number;
    reason: string;
}

export const predictAllergenRisks = (
    symptoms: Symptom[],
    meals: Meal[],
    userAllergens: string[]
): PredictionResult[] => {
    const allergenFrequency = new Map<string, { count: number; totalSeverity: number }>();

    symptoms.forEach(symptom => {
        const symptomDate = new Date(symptom.dateISO);
        const recentMeals = meals.filter(meal => {
            const mealDate = meal.timeStamp ? new Date(meal.timeStamp) : meal.createdAt ? new Date(meal.createdAt) : null;
            if (!mealDate) return false;
            const hoursDiff = (symptomDate.getTime() - mealDate.getTime()) / (1000 * 60 * 60);
            return hoursDiff >= 0 && hoursDiff <= 24;
        });

        recentMeals.forEach(meal => {
            const ingredients = meal.ingredients || meal.items || [];
            ingredients.forEach(ingredient => {
                const current = allergenFrequency.get(ingredient) || { count: 0, totalSeverity: 0 };
                allergenFrequency.set(ingredient, {
                    count: current.count + 1,
                    totalSeverity: current.totalSeverity + symptom.severity
                });
            });
        });
    });

    const predictions: PredictionResult[] = [];

    allergenFrequency.forEach((data, allergen) => {
        const avgSeverity = data.totalSeverity / data.count;
        const frequency = data.count / Math.max(symptoms.length, 1);

        // Consistant risk score calculations
        const severityLvl = avgSeverity >= 4 ? 'high' : avgSeverity >= 2.5 ? 'moderate' : 'low';
        const { riskScore } = computeRiskScore([allergen], [{ allergen, severity: severityLvl, sensitivity: 'moderate' }]);

        const adjustedRiskScore = Math.min(100, riskScore * (1 + frequency * 0.5));
        const confidence = Math.min(95, data.count * 20);

        let reason = '';
        if (data.count >= 3) {
            reason = `Frequent correlation (${data.count} times)`;
        } else if (avgSeverity >= 4) {
            reason = 'High severity reactions';
        } else {
            reason = 'Potential trigger';
        }

        if (adjustedRiskScore > RISKTHRES.LOWMAX) {
            predictions.push({ allergen, riskScore: Math.round(adjustedRiskScore), confidence, reason });
        }
    });

    return predictions.sort((a, b) => b.riskScore - a.riskScore).slice(0, 5);
};