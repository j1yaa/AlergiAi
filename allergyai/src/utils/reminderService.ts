import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealReminder {
  id: string;
  mealType: MealType;
  time: string; // HH:MM format
  enabled: boolean;
}

const REMINDERS_KEY = '@meal_reminders';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const requestPermissions = async () => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  return finalStatus === 'granted';
};

export const saveReminders = async (reminders: MealReminder[]) => {
  await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
};

export const loadReminders = async (): Promise<MealReminder[]> => {
  const data = await AsyncStorage.getItem(REMINDERS_KEY);
  if (!data) return getDefaultReminders();
  return JSON.parse(data);
};

const getDefaultReminders = (): MealReminder[] => [
  { id: '1', mealType: 'breakfast', time: '08:00', enabled: false },
  { id: '2', mealType: 'lunch', time: '12:30', enabled: false },
  { id: '3', mealType: 'dinner', time: '18:30', enabled: false },
  { id: '4', mealType: 'snack', time: '15:00', enabled: false },
];

export const scheduleReminder = async (reminder: MealReminder) => {
  if (!reminder.enabled) return;

  const [hours, minutes] = reminder.time.split(':').map(Number);
  
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `Time to log your ${reminder.mealType}`,
      body: `Don't forget to track what you're eating to stay safe from allergens.`,
      data: { mealType: reminder.mealType },
    },
    trigger: {
      hour: hours,
      minute: minutes,
      repeats: true,
    },
  });
};

export const cancelReminder = async (reminderId: string) => {
  const notifications = await Notifications.getAllScheduledNotificationsAsync();
  for (const notification of notifications) {
    if (notification.content.data?.mealType === reminderId) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }
};

export const updateReminder = async (reminder: MealReminder) => {
  await cancelReminder(reminder.mealType);
  if (reminder.enabled) {
    await scheduleReminder(reminder);
  }
  
  const reminders = await loadReminders();
  const updated = reminders.map(r => r.id === reminder.id ? reminder : r);
  await saveReminders(updated);
};

export const cancelAllReminders = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};
