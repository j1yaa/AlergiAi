import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, auth } from '../config/firebase';
import { doc, setDoc } from 'firebase/firestore';

export interface EmergencyContact {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  notifyEnabled: boolean;
}

const EMERGENCY_CONTACT_KEY = '@emergency_contact';

export const getEmergencyContact = async (): Promise<EmergencyContact> => {
  const data = await AsyncStorage.getItem(EMERGENCY_CONTACT_KEY);
  return data ? JSON.parse(data) : {
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    notifyEnabled: false,
  };
};

export const saveEmergencyContact = async (contact: EmergencyContact): Promise<void> => {
  await AsyncStorage.setItem(EMERGENCY_CONTACT_KEY, JSON.stringify(contact));

  const user = auth.currentUser;
  if (user) {
    await setDoc(doc(db, 'users', user.uid), { emergencyContact: contact }, { merge: true });
  }
};
