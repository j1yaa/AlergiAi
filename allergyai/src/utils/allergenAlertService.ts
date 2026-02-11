import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, auth } from '../config/firebase';
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
  notifyEmergencyContact: boolean;
  emergencyContactPhone?: string;
}

const SETTINGS_KEY = '@alert_settings';

export const getAlertSettings = async (): Promise<AlertSettings> => {
  const data = await AsyncStorage.getItem(SETTINGS_KEY);
  return data ? JSON.parse(data) : {
    enabled: true,
    quietHours: { start: '22:00', end: '07:00' },
    severityThreshold: 'low',
    notifyEmergencyContact: false,
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
  mealId?: string
): Promise<string> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const alert = {
    userId: user.uid,
    allergen,
    severity,
    source,
    mealId,
    message: `${severity.toUpperCase()} RISK: ${allergen} detected in your ${source}`,
    timestamp: new Date(),
    read: false,
    acknowledged: false,
  };

  const docRef = await addDoc(collection(db, 'alerts'), alert);
  
  const settings = await getAlertSettings();
  if (settings.enabled && shouldAlert(severity, settings) && !isQuietHours(settings)) {
    await sendPushNotification(allergen, severity);
    
    if (settings.notifyEmergencyContact && severity === 'high' && settings.emergencyContactPhone) {
      console.log(`Emergency contact notified: ${settings.emergencyContactPhone}`);
    }
  }

  return docRef.id;
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
