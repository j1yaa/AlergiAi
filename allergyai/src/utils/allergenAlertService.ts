import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, auth, functions } from '../config/firebase';
import { isInQuietHours } from './quietHoursUtils';
import { httpsCallable } from 'firebase/functions';
import { getEmergencyContact } from './emergencyContactService';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, orderBy, limit, deleteDoc, writeBatch } from 'firebase/firestore';

export interface AllergenAlert {
  id: string;
  userId: string;
  allergen: string;
  severity: 'minimal' | 'low' | 'moderate' | 'high' | 'severe';
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
  severityThreshold: 'minimal' | 'low' | 'moderate' | 'high' | 'severe';
  notifyEmergencyContact?: boolean;
  emergencyContactPhone?: string;
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

export const isQuietHours = (settings: AlertSettings, now?: Date): boolean =>
  isInQuietHours(settings.quietHours, now);

const shouldAlert = (severity: string, settings: AlertSettings): boolean => {
  const levels = { minimal: 1, low: 2, moderate: 3, high: 4, severe: 5 };
  const threshold = settings.severityThreshold || 'minimal';
  return (levels[severity as keyof typeof levels] || 1) >= (levels[threshold as keyof typeof levels] || 1);
};

export const createAlert = async (
  allergen: string,
  severity: 'minimal' | 'low' | 'moderate' | 'high' | 'severe',
  source: 'meal' | 'scan' | 'manual',
  mealId?: string,
  userAllergenSeverity?: 'minimal' | 'low' | 'moderate' | 'high' | 'severe'
): Promise<string> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  // Always use user's allergen severity if explicitly set, otherwise use computed
  const severityLevels = { minimal: 1, low: 2, moderate: 3, high: 4, severe: 5 };
  const finalSeverity: 'minimal' | 'low' | 'moderate' | 'high' | 'severe' =
    userAllergenSeverity ? userAllergenSeverity : severity;

  // Request permissions if not already granted
  await requestNotificationPermissions();

  const alert: any = {
    userId: user.uid,
    allergen,
    allergens: [allergen],
    severity: finalSeverity,
    source,
    message: `${finalSeverity.toUpperCase()} RISK: ${allergen} detected in your ${source}`,
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
  if (settings.enabled && shouldAlert(finalSeverity, settings) && !isQuietHours(settings)) {
    await sendPushNotification(allergen, finalSeverity);

    const isHighRisk = finalSeverity === 'high' || finalSeverity === 'severe';
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

  // Notify the user with a push notification confirming outreach
  const contactName = [contact.firstName, contact.lastName].filter(Boolean).join(' ') || 'your emergency contact';
  const subject = isSymptom ? 'Symptom Alert' : 'Allergen Alert';
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `🚨 ${subject}`,
      body: `Notifying ${contactName} about ${reason}.`,
      data: { type: 'emergency', reason },
      sound: true,
    },
    trigger: null,
  });

  // Send via Firebase Cloud Function (Twilio SMS + SendGrid email)
  // Respect the contact's opted-in channel preference
  const notifyVia = contact.notifyVia ?? 'both';
  const contactPhone = (notifyVia === 'text' || notifyVia === 'both') ? contact.phone : null;
  const contactEmail = (notifyVia === 'email' || notifyVia === 'both') ? contact.email : null;

  try {
    const sendEmergencyAlert = httpsCallable(functions, 'sendEmergencyAlert');
    await sendEmergencyAlert({
      contactPhone,
      contactEmail,
      contactName,
      reason,
      userName,
      isSymptom,
    });
  } catch (e) {
    console.warn('Could not send emergency alert:', e);
  }
};

export const notifyEmergencyContactForSymptom = async (symptomName: string): Promise<void> => {
  await notifyEmergencyContact(symptomName, true);
};

const sendPushNotification = async (allergen: string, severity: string) => {
  const emoji = severity === 'severe' || severity === 'high' ? '🚨' : severity === 'moderate' ? '⚠️' : 'ℹ️';
  
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

export const clearAlerts = async (severity?: 'minimal' | 'low' | 'moderate' | 'high' | 'severe') => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  let q;
  if (severity) {
    q = query(
      collection(db, 'alerts'),
      where('userId', '==', user.uid),
      where('severity', '==', severity)
    );
  } else {
    q = query(collection(db, 'alerts'), where('userId', '==', user.uid));
  }

  const snapshot = await getDocs(q);
  const batch = writeBatch(db);
  snapshot.docs.forEach(d => batch.delete(d.ref));
  await batch.commit();
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
