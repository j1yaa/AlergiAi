import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { loadReminders, scheduleReminder } from '../utils/reminderService';

export const useNotificationSetup = () => {
  useEffect(() => {
    setupNotifications();
  }, []);

  const setupNotifications = async () => {
    const reminders = await loadReminders();
    
    // Schedule all enabled reminders
    for (const reminder of reminders) {
      if (reminder.enabled) {
        await scheduleReminder(reminder);
      }
    }

    // Handle notification responses (when user taps notification)
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const mealType = response.notification.request.content.data?.mealType;
      console.log('User tapped notification for:', mealType);
      // You can navigate to AddMeal screen here if needed
    });

    return () => subscription.remove();
  };
};
