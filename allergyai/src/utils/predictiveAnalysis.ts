import { Symptom, Meal } from '../types';
import {computeRiskScore } from './smartAnalyzer';
import { RISKTHRES } from './riskConstants';
interface PredictionResult {
    allergen: string;
    riskScore: number;
    confidence: number;
    reasonKey: 'frequentCorrelation' | 'highSeverity' | 'potentialTrigger';
    reasonCount?: number;
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
        const severityLvl = avgSeverity >= 4 ? 'severe' : avgSeverity >= 3.5 ?
            'high' : avgSeverity >= 2.5 ? 'moderate' : avgSeverity >= 1.5 ? 'low' : 'minimal';
        const { riskScore } = computeRiskScore([allergen], [{ allergen, severity: severityLvl, sensitivity: 'moderate' }]);

        const allergenLower = allergen.toLowerCase();
        let riskModifier = 1.0;
        if (allergenLower.includes('peanut') || allergenLower.includes('shellfish') || allergenLower.includes('tree nut')) {
            riskModifier = 1.15;
        } else if (allergenLower.includes('dairy') || allergenLower.includes('milk') || allergenLower.includes('egg')) {
            riskModifier = 1.1;
        } else if (allergenLower.includes('wheat') || allergenLower.includes('soy')) {
            riskModifier = 1.05;
        }

        const adjustedRiskScore = Math.min(100, Math.round(riskScore * (1 + frequency * 0.5) * riskModifier));
        const sampleSize = Math.min(data.count / 10, 1);
        const consistencyScore = frequency * 100;
        const severityWeight = (avgSeverity / 5) * 20;
        const varAdjustment = (allergen.length % 5) - 2;
        const confidence = Math.min(95, Math.max(40, Math.round(40 + sampleSize * 35 + consistencyScore * 0.2 + severityWeight + varAdjustment)));

        let reasonKey: PredictionResult['reasonKey'];
        let reasonCount: number | undefined;
        if (data.count >= 3) {
            reasonKey = 'frequentCorrelation';
            reasonCount = data.count;
        } else if (avgSeverity >= 4) {
            reasonKey = 'highSeverity';
        } else {
            reasonKey = 'potentialTrigger';
        }

        if (adjustedRiskScore > RISKTHRES.LOWMAX) {
            predictions.push({ allergen, riskScore: Math.round(adjustedRiskScore), confidence, reasonKey, reasonCount });
        }
    });

    return predictions.sort((a, b) => b.riskScore - a.riskScore).slice(0, 5);
};