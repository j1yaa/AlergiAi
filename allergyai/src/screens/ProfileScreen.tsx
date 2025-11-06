import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
// Mock user profile type and data
interface UserProfile {
  id: string;
  name: string;
  email: string;
  allergens: string[];
  totalMeals: number;
  totalAlerts: number;
  createdAt: string;
}

// Placeholder function for getting profile
const getProfile = async (): Promise<UserProfile> => {
  return {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    allergens: ['Peanuts', 'Shellfish', 'Dairy'],
    totalMeals: 127,
    totalAlerts: 8,
    createdAt: '2022-01-15T10:00:00Z',
  };
};

export default function ProfileScreen({ navigation }: any) {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => { loadProfile(); }, []);

    const loadProfile = async () => {
        setLoading(true);
        try {
            const data = await getProfile();
            setProfile(data);
        } catch (error) {
            console.error('Failed to load the profile:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !profile) {
        return (
            <View style={styles.container}>
                <Text>Loading...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Profile</Text>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Personal Information</Text>
                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Name</Text>
                        <Text style={styles.value}>{profile.name}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Email</Text>
                        <Text style={styles.value}>{profile.email}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Member Since</Text>
                        <Text style={styles.value}>
                            {new Date(profile.createdAt).toLocaleDateString()}
                        </Text>
                    </View>
                </View>
            </View>

            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>My Allergens</Text>
                    <TouchableOpacity
                        style={styles.manageButton}
                        onPress={() => navigation.navigate('Allergens')}
                    >
                        <Text style={styles.manageButtonText}>Manage</Text>
                    </TouchableOpacity>
                </View>
                {profile.allergens.length > 0 ? (
                    <View style={styles.allergenContainer}>
                        {profile.allergens.map((allergen, index) => (
                            <View key={index} style={styles.allergenPill}>
                                <Text style={styles.allergenText}>{allergen}</Text>
                            </View>
                        ))}
                    </View>
                ) : (
                    <Text style={styles.noAllergens}>No allergens added yet</Text>
                )}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Statistics</Text>
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{profile.totalMeals}</Text>
                        <Text style={styles.statLabel}>Total Meals</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{profile.totalAlerts}</Text>
                        <Text style={styles.statLabel}>Alerts Triggered</Text>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    section: {
        marginBottom: 25,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    infoCard: {
        backgroundColor: '#f5f5f5',
        padding: 15,
        borderRadius: 8,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    label: {
        fontSize: 14,
        color: '#666',
    },
    value: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    manageButton: {
        backgroundColor: '#2196F3',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 16,
    },
    manageButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    allergenContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    allergenPill: {
        backgroundColor: '#ffebee',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        marginRight: 8,
        marginBottom: 8,
    },
    allergenText: {
        color: '#d32f2f',
        fontSize: 14,
        fontWeight: 'bold',
    },
    noAllergens: {
        color: '#999',
        fontSize: 16,
        fontStyle: 'italic',
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statCard: {
        backgroundColor: '#f5f5f5',
        padding: 20,
        borderRadius: 8,
        alignItems: 'center',
        flex: 0.48,
    },
    statValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#2196F3',
    },
    statLabel: {
        fontSize: 14,
        color: '#666',
        marginTop: 5,
    },
});