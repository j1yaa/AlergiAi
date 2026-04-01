import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { getMeals, getAllergens, getSymptoms } from '../api/client';
import { Meal, Symptom, AllergenWithSeverity } from '../types';

const escapeCSV = (value: string | number | undefined): string => {
  const str = String(value ?? '');
  return str.includes(',') || str.includes('"') || str.includes('\n')
    ? `"${str.replace(/"/g, '""')}"`
    : str;
};

const buildCSV = (
  meals: Meal[],
  allergens: string[],
  allergensSeverity: AllergenWithSeverity[],
  symptoms: Symptom[]
): string => {
  const lines: string[] = [];

  lines.push('ALLERGI AI - MEDICAL REPORT');
  lines.push(`Generated: ${new Date().toLocaleString()}`);
  lines.push('');

  // Allergens section
  lines.push('ALLERGEN PROFILE');
  lines.push('Allergen,Severity');
  allergens.forEach(name => {
    const sev = allergensSeverity.find(a => a.name === name)?.severity ?? 'unknown';
    lines.push(`${escapeCSV(name)},${escapeCSV(sev)}`);
  });
  lines.push('');

  // Meals section
  lines.push('MEAL HISTORY');
  lines.push('Date,Description,Ingredients,Allergens Detected,Risk Score');
  meals.forEach(meal => {
    const date = meal.createdAt
      ? new Date(meal.createdAt).toLocaleDateString()
      : meal.timeStamp
      ? new Date(meal.timeStamp).toLocaleDateString()
      : 'Unknown';
    const description = meal.description || meal.items?.join('; ') || '';
    const ingredients = meal.ingredients?.join('; ') ?? '';
    const detectedAllergens = meal.allergens?.join('; ') ?? '';
    lines.push(
      [date, description, ingredients, detectedAllergens, ''].map(escapeCSV).join(',')
    );
  });
  lines.push('');

  // Symptoms section
  lines.push('SYMPTOM LOG');
  lines.push('Date,Description,Severity (1-5),Category');
  symptoms.forEach(s => {
    const date = s.dateISO ? new Date(s.dateISO).toLocaleDateString() : 'Unknown';
    lines.push(
      [date, s.description, s.severity, s.category ?? 'other'].map(escapeCSV).join(',')
    );
  });

  return lines.join('\n');
};

export const exportMedicalReport = async (): Promise<void> => {
  const [meals, { allergens, allergensSeverity }, symptomsResponse] = await Promise.all([
    getMeals(),
    getAllergens(),
    getSymptoms(),
  ]);

  const csv = buildCSV(meals, allergens, allergensSeverity ?? [], symptomsResponse.items);

  const fileName = `allergi_ai_report_${Date.now()}.csv`;
  const fileUri = (FileSystem.documentDirectory ?? '') + fileName;

  await FileSystem.writeAsStringAsync(fileUri, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Sharing is not available on this device');
  }

  await Sharing.shareAsync(fileUri, {
    mimeType: 'text/csv',
    dialogTitle: 'Export Medical Report',
    UTI: 'public.comma-separated-values-text',
  });
};
