import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Switch, Linking, ScrollView, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { getProfile, logout } from '../api/client';
import { UserProfile } from '../types';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';
import { ThemeToggle } from '../components';
import * as Notifications from 'expo-notifications';
import { getAlertSettings, saveAlertSettings } from '../utils/allergenAlertService';
import { exportMedicalReport } from '../utils/exportService';

export default function ProfileScreen({ navigation, onLogout }: { navigation: any; onLogout?: () => void }) {
    const { colors } = useTheme();
    const { language, setLanguage, t } = useLanguage();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [imageError, setImageError] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [pushEnabled, setPushEnabled] = useState(true);
    const [exporting, setExporting] = useState(false);

    const loadProfile = useCallback(async () => {
        try {
            const [profileData, alertSettings, savedImage] = await Promise.all([
                getProfile(),
                getAlertSettings(),
                AsyncStorage.getItem('profile_picture_uri')
            ]);
            setProfile(profileData);
            setProfileImage(savedImage);
            if (savedImage) setImageError(false);
            setPushEnabled(alertSettings.enabled);
            setLoading(false);
        } catch (error) {
            console.error('Failed to load profile:', error);
            setLoading(false);
        }
    }, []);

    useFocusEffect(useCallback(() => {
        loadProfile();
    }, [loadProfile]));

    const handleTogglePush = async (value: boolean) => {
        if (value) {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            if (existingStatus === 'granted') {
                setPushEnabled(true);
                const alertSettings = await getAlertSettings();
                await saveAlertSettings({ ...alertSettings, enabled: true });
            } else {
                const { status } = await Notifications.requestPermissionsAsync();
                if (status === 'granted') {
                    setPushEnabled(true);
                    const alertSettings = await getAlertSettings();
                    await saveAlertSettings({ ...alertSettings, enabled: true });
                } else {
                    Alert.alert(
                        t('settings.notificationsDisabled'),
                        t('settings.notificationsDisabledMessage'),
                        [
                            { text: t('settings.cancel'), style: 'cancel' },
                            { text: t('settings.openSettings'), onPress: () => Linking.openSettings() }
                        ]
                    );
                }
            }
        } else {
            setPushEnabled(false);
            const alertSettings = await getAlertSettings();
            await saveAlertSettings({ ...alertSettings, enabled: false });
        }
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            await exportMedicalReport();
        } catch (error: any) {
            Alert.alert(t('settings.exportFailed'), error.message || 'Could not export report. Please try again.');
        } finally {
            setExporting(false);
        }
    };

    const handleLogout = () => {
        Alert.alert(t('settings.logout'), t('settings.logoutConfirm'), [
            { text: t('settings.cancel'), style: 'cancel' },
            {
                text: t('settings.logout'),
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
                <Text style={[styles.loadingText, { color: colors.icon }]}>{t('settings.loading')}</Text>
            </View>
        );
    }

    if (!profile) {
        return (
            <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
                <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.error }]}>{t('settings.failedToLoadProfile')}</Text>
                <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={loadProfile}>
                    <Text style={styles.retryButtonText}>{t('settings.retry')}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Welcome Header */}
            <View style={[styles.welcomeSection, { backgroundColor: colors.surface }]}>
                {profileImage && !imageError ? (
                    <Image
                        source={{ uri: profileImage }}
                        style={styles.profileImage}
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <View style={styles.profileIcon}>
                        <Text style={styles.profileInitials}>
                            {profile.name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase() || '?'}
                        </Text>
                    </View>
                )}
                <View style={styles.welcomeText}>
                    <Text style={[styles.welcomeLabel, { color: colors.icon }]}>{t('settings.welcome')}</Text>
                    <Text style={[styles.welcomeName, { color: colors.text }]}>{profile.name}</Text>
                    <Text style={[styles.welcomeEmail, { color: colors.icon }]}>{profile.email}</Text>
                </View>
            </View>

            {/* Account Section */}
            <Text style={[styles.sectionLabel, { color: colors.icon }]}>{t('settings.accountSection')}</Text>
            <View style={[styles.group, { backgroundColor: colors.surface }]}>
                <TouchableOpacity
                    style={styles.groupItem}
                    onPress={() => navigation.navigate('UserProfile')}
                >
                    <Ionicons name="person-outline" size={20} color={colors.primary} />
                    <Text style={[styles.groupItemText, { color: colors.text }]}>{t('settings.userProfile')}</Text>
                    <Ionicons name="chevron-forward" size={18} color={colors.icon} />
                </TouchableOpacity>

                <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />

                <TouchableOpacity
                    style={styles.groupItem}
                    onPress={() => navigation.navigate('ChangePassword')}
                >
                    <Ionicons name="lock-closed-outline" size={20} color={colors.primary} />
                    <Text style={[styles.groupItemText, { color: colors.text }]}>{t('settings.changePassword')}</Text>
                    <Ionicons name="chevron-forward" size={18} color={colors.icon} />
                </TouchableOpacity>

                <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />

                <TouchableOpacity
                    style={styles.groupItem}
                    onPress={() => navigation.navigate('WearableSettings')}
                >
                    <Ionicons name="watch-outline" size={20} color={colors.primary} />
                    <Text style={[styles.groupItemText, { color: colors.text }]}>{t('settings.wearableDevices')}</Text>
                    <Ionicons name="chevron-forward" size={18} color={colors.icon} />
                </TouchableOpacity>

                <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />

                <TouchableOpacity
                    style={styles.groupItem}
                    onPress={() => navigation.navigate('EmergencyContact')}
                >
                    <Ionicons name="call-outline" size={20} color={colors.primary} />
                    <Text style={[styles.groupItemText, { color: colors.text }]}>{t('settings.emergencyContact')}</Text>
                    <Ionicons name="chevron-forward" size={18} color={colors.icon} />
                </TouchableOpacity>
            </View>

            {/* Data Section */}
            <Text style={[styles.sectionLabel, { color: colors.icon }]}>{t('settings.dataSection')}</Text>
            <View style={[styles.group, { backgroundColor: colors.surface }]}>
                <TouchableOpacity
                    style={styles.groupItem}
                    onPress={handleExport}
                    disabled={exporting}
                >
                    <Ionicons name="download-outline" size={20} color={colors.primary} />
                    <Text style={[styles.groupItemText, { color: colors.text }]}>{t('settings.exportMedicalReport')}</Text>
                    {exporting
                        ? <ActivityIndicator size="small" color={colors.primary} />
                        : <Ionicons name="chevron-forward" size={18} color={colors.icon} />}
                </TouchableOpacity>
            </View>

            {/* Notifications Section */}
            <Text style={[styles.sectionLabel, { color: colors.icon }]}>{t('settings.notificationsSection')}</Text>
            <View style={[styles.group, { backgroundColor: colors.surface }]}>
                <View style={styles.groupItem}>
                    <Ionicons name="notifications-outline" size={20} color={colors.primary} />
                    <Text style={[styles.groupItemText, { color: colors.text }]}>{t('settings.pushNotifications')}</Text>
                    <Switch
                        value={pushEnabled}
                        onValueChange={handleTogglePush}
                        trackColor={{ false: '#767577', true: '#81c784' }}
                        thumbColor={pushEnabled ? '#4caf50' : '#f4f3f4'}
                    />
                </View>

                {pushEnabled && (
                    <>
                        <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />
                        <TouchableOpacity
                            style={styles.groupItem}
                            onPress={() => navigation.navigate('ReminderSettings')}
                        >
                            <Ionicons name="alarm-outline" size={20} color={colors.primary} />
                            <Text style={[styles.groupItemText, { color: colors.text }]}>{t('settings.mealReminders')}</Text>
                            <Ionicons name="chevron-forward" size={18} color={colors.icon} />
                        </TouchableOpacity>

                        <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />
                        <TouchableOpacity
                            style={styles.groupItem}
                            onPress={() => navigation.navigate('AlertSettings')}
                        >
                            <Ionicons name="warning-outline" size={20} color={colors.primary} />
                            <Text style={[styles.groupItemText, { color: colors.text }]}>{t('settings.alertSettings')}</Text>
                            <Ionicons name="chevron-forward" size={18} color={colors.icon} />
                        </TouchableOpacity>
                    </>
                )}
            </View>

            {/* Preferences Section */}
            <Text style={[styles.sectionLabel, { color: colors.icon }]}>{t('settings.preferencesSection')}</Text>
            <View style={[styles.group, { backgroundColor: colors.surface }]}>
                <View style={styles.themeRow}>
                    <Ionicons name="color-palette-outline" size={20} color={colors.primary} />
                    <Text style={[styles.groupItemText, { color: colors.text }]}>{t('settings.theme')}</Text>
                </View>
                <View style={styles.themeToggleWrapper}>
                    <ThemeToggle />
                </View>

                <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />

                <View style={styles.groupItem}>
                    <Ionicons name="language-outline" size={20} color={colors.primary} />
                    <Text style={[styles.groupItemText, { color: colors.text }]}>{t('settings.language')}</Text>
                </View>
                <View style={styles.languageRow}>
                    {(['en', 'es'] as const).map((lang) => (
                        <TouchableOpacity
                            key={lang}
                            style={[
                                styles.languageOption,
                                { borderColor: language === lang ? colors.primary : colors.cardBorder },
                                language === lang && { backgroundColor: colors.primary + '15' },
                            ]}
                            onPress={() => setLanguage(lang)}
                        >
                            <Text style={[
                                styles.languageOptionText,
                                { color: language === lang ? colors.primary : colors.text },
                            ]}>
                                {t(`languages.${lang}`)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Logout */}
            <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
            >
                <Ionicons name="log-out-outline" size={20} color="#E53935" />
                <Text style={styles.logoutText}>{t('settings.logout')}</Text>
            </TouchableOpacity>
        </ScrollView>
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
    welcomeSection: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderRadius: 16,
        marginBottom: 28,
    },
    profileIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#0B63D6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    profileInitials: {
        fontSize: 22,
        fontWeight: '700',
        color: '#fff',
    },
    welcomeText: {
        flex: 1,
        marginLeft: 16,
    },
    welcomeLabel: {
        fontSize: 13,
    },
    welcomeName: {
        fontSize: 20,
        fontWeight: '700',
        marginTop: 2,
    },
    welcomeEmail: {
        fontSize: 13,
        marginTop: 2,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 0.8,
        marginBottom: 8,
        marginLeft: 4,
    },
    group: {
        borderRadius: 14,
        marginBottom: 24,
        overflow: 'hidden',
    },
    groupItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        gap: 12,
    },
    groupItemText: {
        fontSize: 16,
        fontWeight: '500',
        flex: 1,
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        marginLeft: 48,
    },
    themeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 14,
        paddingHorizontal: 16,
        gap: 12,
    },
    themeToggleWrapper: {
        paddingHorizontal: 16,
        paddingBottom: 14,
        paddingTop: 10,
    },
    languageRow: {
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 16,
        paddingBottom: 14,
        paddingTop: 4,
    },
    languageOption: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1.5,
        alignItems: 'center',
    },
    languageOptionText: {
        fontSize: 14,
        fontWeight: '600',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        gap: 8,
        marginBottom: 40,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#E53935',
    },
});
