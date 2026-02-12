# Meal Reminder Feature

## Overview
The meal reminder feature allows users to set up push notifications for logging their meals throughout the day. This helps users stay consistent with tracking their food intake and allergen exposure.

## Features
- **4 Default Meal Types**: Breakfast, Lunch, Dinner, and Snack
- **Customizable Times**: Users can set specific times for each meal reminder
- **Toggle On/Off**: Each reminder can be individually enabled or disabled
- **Push Notifications**: Native notifications that work even when the app is closed
- **Persistent Storage**: Reminder settings are saved locally and persist across app restarts

## How It Works

### User Flow
1. User opens the Add Meal screen
2. Taps the bell icon (🔔) in the header to access Reminder Settings
3. Enables desired meal reminders and sets preferred times
4. Receives push notifications at scheduled times
5. Taps notification to open the app and log their meal

### Technical Implementation

#### Files Created
- `src/utils/reminderService.ts` - Core notification logic
- `src/screens/ReminderSettingsScreen.tsx` - UI for managing reminders
- `src/utils/useNotificationSetup.ts` - Hook to initialize notifications

#### Files Modified
- `src/screens/AddMealScreen.tsx` - Added reminder button
- `src/navigation/RootNavigator.tsx` - Added reminder screen to navigation
- `package.json` - Added expo-notifications dependency
- `app.json` - Added notification permissions and plugin config
- `App.tsx` - Initialize notifications on app start

## Installation

1. Install dependencies:
```bash
cd allergyai
npm install
```

2. For iOS, install pods:
```bash
npx pod-install
```

3. Rebuild the app:
```bash
npx expo prebuild --clean
npx expo run:ios  # or run:android
```

## Usage

### Setting Up Reminders
```typescript
import { updateReminder, MealReminder } from '../utils/reminderService';

const reminder: MealReminder = {
  id: '1',
  mealType: 'breakfast',
  time: '08:00',
  enabled: true
};

await updateReminder(reminder);
```

### Requesting Permissions
```typescript
import { requestPermissions } from '../utils/reminderService';

const granted = await requestPermissions();
if (granted) {
  // Set up reminders
}
```

## Notification Format
- **Title**: "Time to log your [meal type]! 🍽️"
- **Body**: "Don't forget to track what you're eating to stay safe from allergens."
- **Data**: Contains meal type for handling notification taps

## Storage
Reminders are stored in AsyncStorage under the key `@meal_reminders` as JSON.

## Permissions
- **iOS**: Automatically requests notification permissions
- **Android**: Requires POST_NOTIFICATIONS permission (Android 13+)

## Future Enhancements
- Custom meal types
- Smart reminders based on eating patterns
- Snooze functionality
- Reminder history and analytics
- Integration with calendar apps
