import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MealLog } from '../types/meal';

const KEY = '@meals/v1';

export async function getMeals(): Promise<MealLog[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveMeal(entry: MealLog) {
  const list = await getMeals();
  list.unshift(entry); // newest first
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
}

export async function deleteMeal(id: string) {
  const list = await getMeals();
  const next = list.filter(m => m.id !== id);
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}