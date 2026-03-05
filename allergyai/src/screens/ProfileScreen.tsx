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
            const profileData = await getProfile();
            setProfile(profileData);
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
                    onLogout?.();
                    logout().catch(error => {
                        console.error('Logout cleanup failed:', error);
                    });
                }
            }
        ]);
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.icon }]}>Loading...</Text>
            </View>
        );
    }

    if (!profile) {
        return (
            <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
                <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.error }]}>Failed to load profile</Text>
                <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={loadProfile}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Theme Toggle */}
            <View style={styles.themeSection}>
                <Text style={[styles.themeSectionTitle, { color: colors.text }]}>Theme</Text>
                <ThemeToggle />
            </View>

            {/* Welcome Header */}
            <View style={[styles.welcomeSection, { backgroundColor: colors.surface }]}>
                <View style={styles.welcomeRow}>
                    <View style={styles.profileIcon}>
                        <Text style={styles.profileInitials}>
                            {profile.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </Text>
                    </View>
                    <View style={styles.welcomeText}>
                        <Text style={[styles.welcomeLabel, { color: colors.icon }]}>Welcome</Text>
                        <Text style={[styles.welcomeName, { color: colors.text }]}>{profile.name}</Text>
                    </View>
                    <TouchableOpacity onPress={handleLogout} style={styles.logoutIcon}>
                        <Ionicons name="log-out-outline" size={24} color={colors.error} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Menu Items */}
            <View style={styles.menuSection}>
                <TouchableOpacity
                    style={[styles.menuItem, { backgroundColor: colors.surface }]}
                    onPress={() => navigation.navigate('UserProfile')}
                >
                    <Ionicons name="person-outline" size={22} color={colors.icon} />
                    <Text style={[styles.menuItemText, { color: colors.text }]}>User Profile</Text>
                    <Ionicons name="chevron-forward" size={20} color={colors.icon} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.menuItem, { backgroundColor: colors.surface }]}
                    onPress={() => navigation.navigate('ChangePassword')}
                >
                    <Ionicons name="lock-closed-outline" size={22} color={colors.icon} />
                    <Text style={[styles.menuItemText, { color: colors.text }]}>Change Password</Text>
                    <Ionicons name="chevron-forward" size={20} color={colors.icon} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        marginTop: 16,
        fontSize: 18,
        fontWeight: '600',
    },
    retryButton: {
        marginTop: 20,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    themeSection: {
        marginBottom: 24,
    },
    themeSectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
    },
    welcomeSection: {
        padding: 20,
        borderRadius: 12,
        marginBottom: 24,
    },
    welcomeRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#0B63D6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileInitials: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
    },
    welcomeText: {
        flex: 1,
        marginLeft: 14,
    },
    welcomeLabel: {
        fontSize: 13,
    },
    welcomeName: {
        fontSize: 20,
        fontWeight: '700',
        marginTop: 2,
    },
    logoutIcon: {
        padding: 8,
    },
    menuSection: {
        gap: 12,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 14,
    },
    menuItemText: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
    },
});
