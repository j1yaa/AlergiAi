# Enhanced Allergen Alert Feature

## Overview
The allergen alert system automatically detects allergens in meals, sends push notifications, tracks exposure patterns, and helps users manage their allergen safety.

## Features Implemented

### 1. **Automatic Detection & Alerts**
- Detects allergens when analyzing meals
- Creates alerts with severity levels (low/medium/high)
- Sends push notifications immediately
- Tracks alert source (meal/scan/manual)

### 2. **Alert Management**
- View all alerts with filtering (all/high/medium/low)
- Mark alerts as read/unread
- Acknowledge alerts with action tracking
- Unread badge count in navigation
- Color-coded severity indicators

### 3. **Smart Notifications**
- Customizable severity threshold
- Quiet hours (no alerts during sleep)
- Emergency contact notification for high-risk alerts
- Pattern detection (repeated exposure warnings)

### 4. **Alert Settings**
- Enable/disable alerts globally
- Set quiet hours (start/end time)
- Choose severity threshold
- Configure emergency contact
- Persistent settings storage

### 5. **Exposure Tracking**
- Track allergen exposure over time
- Pattern detection (e.g., "3 exposures this week")
- Historical alert data in Firestore
- Action tracking (avoided/consumed/medicated)

## Files Created

### Core Services
1. **`src/utils/allergenAlertService.ts`**
   - Alert creation and management
   - Push notification handling
   - Exposure pattern detection
   - Settings management

2. **`src/utils/useUnreadAlertCount.ts`**
   - Real-time unread count hook
   - Firestore listener for badge updates

### UI Components
3. **`src/screens/AlertSettingsScreen.tsx`**
   - Alert preferences UI
   - Quiet hours configuration
   - Severity threshold selection
   - Emergency contact setup

## Files Modified

1. **`src/screens/AlertsScreen.tsx`**
   - Added filtering (all/high/medium/low)
   - Mark as read functionality
   - Acknowledge with action tracking
   - Settings button
   - Unread indicators

2. **`src/screens/AddMealScreen.tsx`**
   - Automatic alert creation on meal analysis
   - Severity calculation based on risk score

3. **`src/navigation/RootNavigator.tsx`**
   - Added AlertSettings screen

4. **`src/components/ProfessionalHeader.tsx`**
   - Unread alert badge count
   - Real-time updates

## Data Structure

### AllergenAlert
```typescript
{
  id: string;
  userId: string;
  allergen: string;
  severity: 'low' | 'medium' | 'high';
  source: 'meal' | 'scan' | 'manual';
  mealId?: string;
  message: string;
  timestamp: Date;
  read: boolean;
  acknowledged: boolean;
  actionTaken?: string; // 'avoided' | 'consumed' | 'medicated'
}
```

### AlertSettings
```typescript
{
  enabled: boolean;
  quietHours: { start: string; end: string };
  severityThreshold: 'low' | 'medium' | 'high';
  notifyEmergencyContact: boolean;
  emergencyContactPhone?: string;
}
```

## Usage

### Creating Alerts Programmatically
```typescript
import { createAlert } from '../utils/allergenAlertService';

await createAlert('Peanuts', 'high', 'meal', mealId);
```

### Checking Exposure Patterns
```typescript
import { checkExposurePattern } from '../utils/allergenAlertService';

const warning = await checkExposurePattern('Peanuts');
if (warning) {
  console.log(warning); // "⚠️ You've been exposed to Peanuts 3 times this week"
}
```

### Managing Settings
```typescript
import { getAlertSettings, saveAlertSettings } from '../utils/allergenAlertService';

const settings = await getAlertSettings();
settings.severityThreshold = 'high';
await saveAlertSettings(settings);
```

## User Flow

1. **Meal Analysis**
   - User logs a meal
   - System analyzes ingredients
   - Allergens detected → Alerts created
   - Push notification sent (if enabled)

2. **Alert Review**
   - User sees badge count on Alerts tab
   - Opens Alerts screen
   - Filters by severity if needed
   - Marks alerts as read
   - Acknowledges with action taken

3. **Settings Configuration**
   - Opens Alert Settings from Alerts screen
   - Enables/disables alerts
   - Sets quiet hours
   - Configures severity threshold
   - Adds emergency contact

## Notification Behavior

### When Alerts Are Sent
- ✅ Alerts enabled
- ✅ Severity meets threshold
- ✅ Not in quiet hours
- ✅ Allergen detected

### Notification Content
- **Low Risk**: ℹ️ Info icon, no sound
- **Medium Risk**: ⚠️ Warning icon, no sound
- **High Risk**: 🚨 Alert icon, with sound

### Emergency Contact
- Only triggered for HIGH severity alerts
- Requires emergency contact phone number
- Logs notification in console (SMS integration ready)

## Firestore Collections

### alerts
```
alerts/
  {alertId}/
    - userId: string
    - allergen: string
    - severity: string
    - source: string
    - mealId: string (optional)
    - message: string
    - timestamp: timestamp
    - read: boolean
    - acknowledged: boolean
    - actionTaken: string (optional)
```

## Installation

Already included in the project. Just run:
```bash
npm install
npx expo start
```

## Testing

1. Log a meal with allergens
2. Check for push notification
3. Open Alerts screen
4. Verify badge count
5. Test filtering
6. Mark as read
7. Acknowledge alert
8. Configure settings
9. Test quiet hours

## Future Enhancements

- [ ] Location-based alerts (restaurant warnings)
- [ ] Predictive alerts based on history
- [ ] Safe alternative suggestions
- [ ] Alert export/sharing
- [ ] Integration with health apps
- [ ] Voice alerts for accessibility
- [ ] Multi-language support
- [ ] Alert analytics dashboard
