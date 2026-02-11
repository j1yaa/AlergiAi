import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getProfile, logout } from '../api/client'; 
import { UserProfile } from '../types';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import { ThemeToggle } from '../components';

export default function ProfileScreen({ navigation, onLogout }: { navigation: any; onLogout?: () => void }) {
    const { colors } = useTheme();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const loadProfile = useCallback(async () => {
        try {
            const data = await getProfile();
            setProfile(data);
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
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Theme Toggle */}
            <View style={styles.themeSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Theme</Text>
                <ThemeToggle />
            </View>

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.profileIcon}>
                    <Text style={styles.profileInitials}>
                        {profile.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </Text>
                </View>
                <Text style={[styles.name, { color: colors.text }]}>{profile.name}</Text>
                <Text style={[styles.email, { color: colors.icon }]}>{profile.email}</Text>
            </View>

            {/* Stats */}
            <View style={styles.statsContainer}>
                <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
                    <Ionicons name="restaurant-outline" size={24} color={colors.primary} />
                    <Text style={[styles.statValue, { color: colors.text }]}>{profile.totalMeals}</Text>
                    <Text style={[styles.statLabel, { color: colors.icon }]}>Meals Tracked</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
                    <Ionicons name="warning-outline" size={24} color={colors.error} />
                    <Text style={[styles.statValue, { color: colors.text }]}>{profile.totalAlerts}</Text>
                    <Text style={[styles.statLabel, { color: colors.icon }]}>Alerts</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
                    <Ionicons name="medical-outline" size={24} color={colors.warning} />
                    <Text style={[styles.statValue, { color: colors.text }]}>{profile.allergens.length}</Text>
                    <Text style={[styles.statLabel, { color: colors.icon }]}>Allergens</Text>
                </View>
            </View>

            {/* Allergens */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Active Allergens</Text>
                    <TouchableOpacity
                        style={styles.manageButton}
                        onPress={() => navigation.navigate('Allergens')}
                    >
                        <Text style={styles.manageButtonText}>Manage</Text>
                    </TouchableOpacity>
                </View>
                {profile.allergens.length > 0 ? (
                    <View style={styles.allergensList}>
                        {profile.allergens.map((allergen, index) => (
                            <View key={index} style={styles.allergenPill}>
                                <Ionicons name="alert-circle" size={16} color="#E53935" />
                                <Text style={styles.allergenText}>{allergen}</Text>
                            </View>
                        ))}
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
        padding: 20,
    },
    themeSection: {
        marginBottom: 24,
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
        marginBottom: 4,
    },
    email: {
        fontSize: 16,
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 32,
    },
    statCard: {
        flex: 1,
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
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
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
});