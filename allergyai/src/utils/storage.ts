import * as SecureStore from 'expo-secure-store'; 
import { Platform } from 'react-native';;

// Use SecureStore for native platforms and localStorage for web

export const storage = {

    // Get item from storage
    async setItem(key: string, value: string): Promise<void> {
        if (Platform.OS === 'web') {
            localStorage.setItem(key, value);
        } else {
            await SecureStore.setItemAsync(key, value);
        }
    },

    async getItem(key: string): Promise<string | null> {
        if (Platform.OS === 'web') {
            return localStorage.getItem(key);
        } else {
            return await SecureStore.getItemAsync(key);
        }
    },

    // Remove item from the storage
    async removeItem(key: string): Promise<void> {
        if (Platform.OS === 'web') {
            localStorage.removeItem(key);
        } else {
            await SecureStore.deleteItemAsync(key)
        }
    }
};
