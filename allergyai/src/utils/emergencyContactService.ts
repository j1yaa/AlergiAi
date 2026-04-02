import AsyncStorage from '@react-native-async-storage/async-storage';

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
};
