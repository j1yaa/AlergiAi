import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getProfile, logout, getAllergens } from '../api/client'; 
import { UserProfile, AllergenWithSeverity } from '../types';
import { useFocusEffect } from '@react-navigation/native';

export default function ProfileScreen({ navigation, onLogout }: { navigation: any; onLogout?: () => void }) {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [allergensSeverity, setAllergensSeverity] = useState<AllergenWithSeverity[]>([]);
    const [loading, setLoading] = useState(true);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const loadProfile = useCallback(async () => {
        try {
            const [profileData, allergensData] = await Promise.all([
                getProfile(),
                getAllergens()
            ]);
            setProfile(profileData);
            setAllergensSeverity(allergensData.allergensSeverity || []);
            setLoading(false);
        } catch (error) {
            console.error('Failed to load profile:', error);
            setLoading(false);
        }
    }, []);

    useFocusEffect(useCallback(() => {
        loadProfile();
    }, [loadProfile]));

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Logout',
                style: 'destructive',
                onPress: () => {
                    // Logout immediately for better UX
                    onLogout?.();
                    
                    // Run cleanup in background
                    logout().catch(error => {
                        console.error('Logout cleanup failed:', error);
                    });
                }
            }
        ]);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0B63D6" />
                <Text style={styles.loadingText}>Loading profile...</Text>
            </View>
        );
    }

    if (!profile) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={64} color="#E53935" />
                <Text style={styles.errorText}>Failed to load profile</Text>
                <TouchableOpacity style={styles.retryButton} onPress={loadProfile}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.profileIcon}>
                    <Text style={styles.profileInitials}>
                        {profile.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </Text>
                </View>
                <Text style={styles.name}>{profile.name}</Text>
                <Text style={styles.email}>{profile.email}</Text>
            </View>

            {/* Stats */}
            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Ionicons name="restaurant-outline" size={24} color="#0B63D6" />
                    <Text style={styles.statValue}>{profile.totalMeals}</Text>
                    <Text style={styles.statLabel}>Meals Tracked</Text>
                </View>
                <View style={styles.statCard}>
                    <Ionicons name="warning-outline" size={24} color="#E53935" />
                    <Text style={styles.statValue}>{profile.totalAlerts}</Text>
                    <Text style={styles.statLabel}>Alerts</Text>
                </View>
                <View style={styles.statCard}>
                    <Ionicons name="medical-outline" size={24} color="#FF9800" />
                    <Text style={styles.statValue}>{profile.allergens.length}</Text>
                    <Text style={styles.statLabel}>Allergens</Text>
                </View>
            </View>

            {/* Allergens */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Active Allergens</Text>
                    <TouchableOpacity
                        style={styles.manageButton}
                        onPress={() => navigation.navigate('Allergens')}
                    >
                        <Text style={styles.manageButtonText}>Manage</Text>
                    </TouchableOpacity>
                </View>
                {profile.allergens.length > 0 ? (
                    <View style={styles.allergensList}>
                        {profile.allergens.map((allergen, index) => {
                            const severityData = allergensSeverity.find(a => a.name === allergen);
                            const severity = severityData?.severity || 'moderate';
                            
                            const severityStyles = {
                                low: {
                                    pill: styles.lowRiskPill,
                                    text: styles.lowRiskText,
                                    icon: '#4CAF50'
                                },
                                moderate: {
                                    pill: styles.moderateRiskPill,
                                    text: styles.moderateRiskText,
                                    icon: '#FF9800'
                                },
                                high: {
                                    pill: styles.highRiskPill,
                                    text: styles.highRiskText,
                                    icon: '#E53935'
                                }
                            };
                            
                            const style = severityStyles[severity];
                            
                            return (
                                <View key={index} style={[styles.allergenPill, style.pill]}>
                                    <Ionicons name="alert-circle" size={16} color={style.icon} />
                                    <Text style={[styles.allergenText, style.text]}>{allergen}</Text>
                                </View>
                            );
                        })}
                    </View>
                ) : (
                    <View style={styles.emptyState}>
                        <Ionicons name="medical-outline" size={48} color="#ccc" />
                        <Text style={styles.emptyText}>No allergens added</Text>
                        <Text style={styles.emptySubtext}>Tap Manage to add allergens</Text>
                    </View>
                )}
            </View>

            {/* Logout Button */}
            <TouchableOpacity
                style={[styles.logoutButton, isLoggingOut && styles.logoutButtonDisabled]}
                onPress={handleLogout}
                disabled={isLoggingOut}
            >
                {isLoggingOut ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : (
                    <>
                        <Ionicons name="log-out-outline" size={20} color="#fff" />
                        <Text style={styles.logoutButtonText}>Logout</Text>
                    </>
                )}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F6F9FF',
        padding: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F6F9FF',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F6F9FF',
        padding: 20,
    },
    errorText: {
        marginTop: 16,
        fontSize: 18,
        color: '#E53935',
        fontWeight: '600',
    },
    retryButton: {
        marginTop: 20,
        backgroundColor: '#0B63D6',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    profileIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#0B63D6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    profileInitials: {
        fontSize: 28,
        fontWeight: '700',
        color: '#fff',
    },
    name: {
        fontSize: 24,
        fontWeight: '700',
        color: '#072B5A',
        marginBottom: 4,
    },
    email: {
        fontSize: 16,
        color: '#5C6B7A',
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 32,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
        elevation: 2,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#072B5A',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: '#5C6B7A',
        marginTop: 4,
        textAlign: 'center',
    },
    section: {
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#072B5A',
    },
    manageButton: {
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    manageButtonText: {
        color: '#0B63D6',
        fontSize: 14,
        fontWeight: '600',
    },
    allergensList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    allergenPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFEBEE',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#FFCDD2',
        gap: 6,
    },
    allergenText: {
        color: '#C62828',
        fontSize: 14,
        fontWeight: '500',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 32,
        backgroundColor: '#fff',
        borderRadius: 12,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        fontWeight: '500',
        marginTop: 12,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#bbb',
        marginTop: 4,
    },
    logoutButton: {
        flexDirection: 'row',
        backgroundColor: '#E53935',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginTop: 'auto',
    },
    logoutButtonDisabled: {
        opacity: 0.6,
    },
    logoutButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    lowRiskPill: {
        backgroundColor: '#E8F5E8',
        borderColor: '#C8E6C9',
    },
    moderateRiskPill: {
        backgroundColor: '#FFF3E0',
        borderColor: '#FFCC02',
    },
    highRiskPill: {
        backgroundColor: '#FFEBEE',
        borderColor: '#FFCDD2',
    },
    lowRiskText: {
        color: '#2E7D32',
    },
    moderateRiskText: {
        color: '#F57C00',
    },
    highRiskText: {
        color: '#C62828',
    },
});