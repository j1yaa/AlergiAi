import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface HealthData {
    heartRate?: number;
    steps?: number;
    sleepHours?: number;
    stressLevel?: number;
    timestamp: Date;
}

class HealthService {
    async requestPermissions(): Promise<boolean> {
        try {
            if (Platform.OS === 'ios') {
                return this.requestHealthKitPermissions();
            } else {
                return this.requestGoogleFitPermissions();
            }
        } catch (error) {
            console.error('Error requesting health permissions:', error);
            return false;
        }
    }

    async syncHealthData(): Promise<HealthData[]> {
        try {
            if (Platform.OS === 'ios') {
                return this.syncFromHealthKit();
            } else {
                return this.syncFromGoogleFit();
            }
        } catch (error) {
            console.error('Health sync error:', error);
            return [];
        }
    }

    async saveHealthData(data: HealthData[]): Promise<void> {
        try {
            await AsyncStorage.setItem('healthdata', JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save the health data:', error);
        }
    }

    async getStoredHealthData(): Promise<HealthData[]> {
        try {
            const stored = await AsyncStorage.getItem('healthdata');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Failed to load the health data:', error);
            return [];
        }
    }

    private async requestHealthKitPermissions(): Promise<boolean> {
        console.log('Requesting HealthKit permissions...');
        return new Promise(resolve => {
            setTimeout(() => resolve(true), 1000);
        });
    }

    private async requestGoogleFitPermissions(): Promise<boolean> {
        console.log('Requesting Google Fit permissions...');
        return new Promise(resolve => {
            setTimeout(() => resolve(true), 1000);
        });
    }

    private async syncFromHealthKit(): Promise<HealthData[]> {
        console.log('Syncing from HealthKit...');
        return new Promise(resolve => {
            setTimeout(() => {
                const mockData: HealthData[] = [
                    {
                        heartRate: 72,
                        steps: 8500,
                        sleepHours: 7.5,
                        stressLevel: 2,
                        timestamp: new Date()
                    },
                    {
                        heartRate: 68,
                        steps: 9200,
                        sleepHours: 8.0,
                        stressLevel: 1,
                        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000)
                    }
                ];
                resolve(mockData);
            }, 2000);
        });
    }

    private async syncFromGoogleFit(): Promise<HealthData[]> {
        console.log('Syncing from Google Fit...');
        return new Promise(resolve => {
            setTimeout(() => {
                const mockData: HealthData[] = [
                    {
                        heartRate: 75,
                        steps: 7800,
                        sleepHours: 7.0,
                        stressLevel: 3,
                        timestamp: new Date()
                    },
                    {
                        heartRate: 70,
                        steps: 8900,
                        sleepHours: 7.8,
                        stressLevel: 2,
                        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000)
                    }
                ];
                resolve(mockData);
            }, 2000);
        });
    }
}

export default new HealthService();