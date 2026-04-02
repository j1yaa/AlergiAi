import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking, Platform } from 'react-native';
import { db, auth } from '../config/firebase';
import { getEmergencyContact } from './emergencyContactService';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, orderBy, limit } from 'firebase/firestore';

export interface AllergenAlert {
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
  actionTaken?: string;
}

export interface AlertSettings {
  enabled: boolean;
  quietHours: { start: string; end: string };
  severityThreshold: 'low' | 'medium' | 'high';
}

const SETTINGS_KEY = '@alert_settings';

// Request notification permissions
export const requestNotificationPermissions = async (): Promise<boolean> => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  return finalStatus === 'granted';
};

export const getAlertSettings = async (): Promise<AlertSettings> => {
  const data = await AsyncStorage.getItem(SETTINGS_KEY);
  return data ? JSON.parse(data) : {
    enabled: true,
    quietHours: { start: '22:00', end: '07:00' },
    severityThreshold: 'low',
  };
};

export const saveAlertSettings = async (settings: AlertSettings) => {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

const isQuietHours = (settings: AlertSettings): boolean => {
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  return currentTime >= settings.quietHours.start || currentTime <= settings.quietHours.end;
};

const shouldAlert = (severity: string, settings: AlertSettings): boolean => {
  const levels = { low: 1, medium: 2, high: 3 };
  return levels[severity as keyof typeof levels] >= levels[settings.severityThreshold];
};

export const createAlert = async (
  allergen: string,
  severity: 'low' | 'medium' | 'high',
  source: 'meal' | 'scan' | 'manual',
  mealId?: string,
  userAllergenSeverity?: 'minimal' | 'low' | 'moderate' | 'high' | 'severe'
): Promise<string> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  // Request permissions if not already granted
  await requestNotificationPermissions();

  const alert: any = {
    userId: user.uid,
    allergen,
    allergens: [allergen],
    severity,
    source,
    message: `${severity.toUpperCase()} RISK: ${allergen} detected in your ${source}`,
    timestamp: new Date().toISOString(),
    read: false,
    acknowledged: false,
  };

  if (mealId) {
    alert.mealId = mealId;
  }

  console.log('createAlert: saving to Firestore:', JSON.stringify(alert));
  const docRef = await addDoc(collection(db, 'alerts'), alert);
  console.log('createAlert: saved with id:', docRef.id);
  
  const settings = await getAlertSettings();
  if (settings.enabled && shouldAlert(severity, settings) && !isQuietHours(settings)) {
    await sendPushNotification(allergen, severity);

    const isHighRisk = severity === 'high' ||
      userAllergenSeverity === 'severe' ||
      userAllergenSeverity === 'high';
    if (isHighRisk) {
      await notifyEmergencyContact(allergen);
    }
  }

  return docRef.id;
};

const notifyEmergencyContact = async (reason: string, isSymptom = false) => {
  const contact = await getEmergencyContact();
  if (!contact.notifyEnabled) return;
  if (!contact.phone && !contact.email) return;

  const user = auth.currentUser;
  const userName = user?.displayName || user?.email || 'A user';
  const subject = isSymptom ? 'Symptom Alert' : 'Allergen Alert';
  const message = isSymptom
    ? `SYMPTOM ALERT: ${userName} has logged a severe symptom (${reason}). Please check in on them.`
    : `ALLERGEN ALERT: ${userName} has logged a high-severity allergen (${reason}). Please check in on them.`;

  // Notify the user with a push notification confirming outreach
  const contactName = [contact.firstName, contact.lastName].filter(Boolean).join(' ') || 'your emergency contact';
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `🚨 ${subject}`,
      body: `Notifying ${contactName} about ${reason}. Tap to send message.`,
      data: { type: 'emergency', reason, contact, message, subject },
      sound: true,
    },
    trigger: null,
  });

  // Open SMS (preferred) or email composer pre-filled
  try {
    if (contact.phone) {
      const sep = Platform.OS === 'ios' ? '&' : '?';
      const smsUrl = `sms:${contact.phone}${sep}body=${encodeURIComponent(message)}`;
      await Linking.openURL(smsUrl);
    } else if (contact.email) {
      const emailUrl = `mailto:${contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
      await Linking.openURL(emailUrl);
    }
  } catch (e) {
    console.warn('Could not open SMS/email composer:', e);
  }
};

export const notifyEmergencyContactForSymptom = async (symptomName: string): Promise<void> => {
  await notifyEmergencyContact(symptomName, true);
};

const sendPushNotification = async (allergen: string, severity: string) => {
  const emoji = severity === 'high' ? '🚨' : severity === 'medium' ? '⚠️' : 'ℹ️';
  
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${emoji} Allergen Alert: ${allergen}`,
      body: `${severity.toUpperCase()} risk detected. Check your meal details.`,
      data: { allergen, severity },
      sound: severity === 'high',
    },
    trigger: null,
  });
};

export const markAlertRead = async (alertId: string) => {
  await updateDoc(doc(db, 'alerts', alertId), { read: true });
};

export const acknowledgeAlert = async (alertId: string, action?: string) => {
  await updateDoc(doc(db, 'alerts', alertId), {
    acknowledged: true,
    actionTaken: action,
  });
};

export const getRecentExposure = async (allergen: string, days: number = 7): Promise<number> => {
  const user = auth.currentUser;
  if (!user) return 0;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const q = query(
    collection(db, 'alerts'),
    where('userId', '==', user.uid),
    where('allergen', '==', allergen),
    where('timestamp', '>=', cutoff)
  );

  const snapshot = await getDocs(q);
  return snapshot.size;
};

export const checkExposurePattern = async (allergen: string): Promise<string | null> => {
  const count = await getRecentExposure(allergen, 7);
  
  if (count >= 3) {
    return `⚠️ You've been exposed to ${allergen} ${count} times this week`;
  }
  return null;
};
