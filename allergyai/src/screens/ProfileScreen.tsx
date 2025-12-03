import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getProfile, updateUserSettings, logout } from '../api/client'; 
import { UserProfile } from '../types';
import { isWeb } from '../utils/platform';
import { useFocusEffect } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage';
export default function ProfileScreen({ navigation, onLogout }: { navigation: any; onLogout?: () => void }) {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState('');
    const [editedEmail, setEditedEmail] = useState('');
    const [saving, setSaving] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const loadProfile = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getProfile();
            setProfile(data);
            setEditedName(data.name);
            setEditedEmail(data.email);
        } catch (error) {
            console.error('Failed to load the profile:', error);
            showAlert('Error', 'Failed to load the profile. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadProfile();
        }, [loadProfile])
    );

    const showAlert = (title: string, message: string) => {
        if (isWeb && typeof window !== 'undefined') {
            (window as any).alert(`${title}: ${message}`);
        } else {
            Alert.alert(title, message);
        }
    };

    const handleSave = async () => {
        if (!profile) return;

        if (!editedName.trim()) {
            showAlert('Validation Error', 'Name cannot be empty');
            return;
        }

        if (!editedEmail.trim() || !editedEmail.includes('@')) {
            showAlert('Validation Error', 'Please enter a valid email address');
            return;
        }

        setSaving(true);
        try {
            // Call API to update the user settings
            await updateUserSettings({
                name: editedName.trim(),
                email: editedEmail.trim(),
                allergens: profile.allergens,
                diet: '',
                notifications: true,
            });

            // Update the profile data locally after the API call
            const updatedProfile = {
                ...profile,
                name: editedName.trim(),
                email: editedEmail.trim()
            };
            setProfile(updatedProfile);

            setIsEditing(false);
            showAlert('Success', 'Profile was successfully updated!');
        } catch (error) {
            console.error('Failed to update the profile:', error);
            showAlert('Error', 'Failed to update the profile. Please try again.');

            // Revert the changes when theres an error
            setEditedName(profile.name);
            setEditedEmail(profile.email);
        } finally {
            setSaving(false);
        }
    };
    
    const handleCancel = () => {
        if (profile) {
            setEditedName(profile.name);
            setEditedEmail(profile.email);
        }
        setIsEditing(false);
    };

    const handleLogout = () => {
        Alert.alert('Logout',
            'Are you sure you want to logout?', [
            { text: 'Cancel', onPress: () => { }, style: 'cancel' },
                {
                    text: 'Logout', onPress: async () => {
                        console.log('Logout button pressed');
                        setIsLoggingOut(true);
                        try {
                            console.log('Starting logout process..');
                            await logout();
                            console.log('Logout API call completed');

                            await AsyncStorage.removeItem('auth_token');
                            console.log('Auth token removed');

                            await AsyncStorage.removeItem('@allergyai_user');
                            console.log('User data removed');

                            console.log('Calling onLogout callback');
                            if (onLogout) {
                                onLogout();
                            } else {
                                console.warn('onLogout callback is not defined');
                            }
                        } catch (error) {
                            console.error('Logout failed:', error);
                            showAlert('Error', 'Failed to logout. Please try again.');
                        } finally {
                            console.log('Logout process completed');
                            setIsLoggingOut(false);
                        }
                    },
                    style: 'destructive'
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2196F3" />
                <Text style={styles.loadingText}>Loading the profile...</Text>
            </View>
        );
    }

    if (!profile) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={64} color="#E53935" />
                <Text style={styles.errorText}>Failed to load the profile.</Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={loadProfile}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }  

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={true}
            >
                <Text style={styles.title}>Profile</Text>

                {/* PROFILE ICON SECTION */}
                <View style={styles.profileIconContainer}>
                    <View style={styles.profileIcon}>
                        <Ionicons name="person" size={60} color="#666" />
                    </View>
                    <Text style={styles.profileInitials}>
                        {profile.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                    </Text>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Personal Information</Text>
                        {!isEditing ? (
                            <TouchableOpacity
                                style={styles.editButton}
                                onPress={() => setIsEditing(true)}
                            >
                                <Ionicons name="create-outline" size={20} color="#2196F3" />
                                <Text style={styles.editButtonText}>Edit</Text>
                            </TouchableOpacity>
                        ) : (
                                <View style={styles.editActions}>
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.cancelButton]}
                                        onPress={handleCancel}
                                        disabled={saving}
                                    >
                                        <Text style={styles.cancelButtonText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.saveButton, saving && styles.saveButtonDisabled]}
                                        onPress={handleSave}
                                        disabled={saving}
                                    >
                                        {saving ? (
                                            <ActivityIndicator size="small" color="#fff" />
                                        ) : (
                                            <Text style={styles.saveButtonText}>Save</Text>
                                        )}
                                    </TouchableOpacity>
                            </View>
                        )}
                    </View>
                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Name</Text>
                            {isEditing ? (
                                <TextInput
                                    style={styles.textInput}
                                    value={editedName}
                                    onChangeText={setEditedName}
                                    placeholder="Enter your name"
                                    editable={!saving}
                                />
                            ) : (
                                <Text style={styles.value}>{profile.name}</Text>
                            )}
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Email</Text>
                            {isEditing ? (
                                <TextInput
                                    style={styles.textInput}
                                    value={editedEmail}
                                    onChangeText={setEditedEmail}
                                    placeholder="Enter your email"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    editable={!saving}
                                />
                            ) : (
                                <Text style={styles.value}>{profile.email}</Text>
                            )}
                        </View>
                        <View style={[styles.infoRow, styles.infoRowLast]}>
                            <Text style={styles.label}>Member Since</Text>
                            <Text style={styles.value}>
                                {new Date(profile.createdAt).toLocaleDateString()}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* ALLERGENS SECTION */}
                {/*<View style={styles.section}>*/}
                {/*    <View style={styles.sectionHeader}>*/}
                {/*        <Text style={styles.sectionTitle}>My Allergens</Text>*/}
                {/*        <TouchableOpacity*/}
                {/*            style={styles.manageButton}*/}
                {/*            onPress={() => navigation.navigate('Allergens')}*/}
                {/*    >*/}
                {/*        <Text style={styles.manageButtonText}>Manage</Text>*/}
                {/*    </TouchableOpacity>*/}
                {/*</View>*/}
                {/*{profile.allergens.length > 0 ? (*/}
                {/*    <View style={styles.allergenContainer}>*/}
                {/*        {profile.allergens.map((allergen: string, index: number) => (*/}
                {/*            <View key={index} style={styles.allergenPill}>*/}
                {/*                <Text style={styles.allergenText}>{allergen}</Text>*/}
                {/*            </View>*/}
                {/*        ))}*/}
                {/*    </View>*/}
                {/*) : (*/}
                {/*    <View style={styles.emptyState}>*/}
                {/*                <Ionicons name="medical-outline" size={48} color="#ccc" />*/}
                {/*                <Text style={styles.noAllergens}>No allergens added yet</Text>*/}
                {/*                <Text style={styles.emptyStateSubtext}>*/}
                {/*                    Tap <Text style={{ fontWeight: 'bold' }}>Manage</Text> to add allergens*/}
                {/*                </Text>*/}
                {/*        </View>*/}
                {/*    )}*/}
                {/*</View>*/}

                {/* STATISTICS SECTION */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Statistics</Text>
                    <View style={styles.statsContainer}>
                        <View style={styles.statCard}>
                        <Ionicons name="restaurant-outline" size={32} color="#2196F3" />
                        <Text style={styles.statValue}>{profile.totalMeals}</Text>
                        <Text style={styles.statLabel}>Total Meals</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="warning-outline" size={32} color="#E53935" />
                        <Text style={styles.statValue}>{profile.totalAlerts}</Text>
                        <Text style={styles.statLabel}>Alerts Triggered</Text>
                    </View>
                    </View>
                </View>

                {/* ACTIVE ALLERGEN LIST */}
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
                        <View style={styles.activeAllergensCard}>
                            {profile.allergens.map((allergen: string, index: number) => (
                                <View key={index}style={[
                                    styles.activeAllergenRow,
                                    index === profile.allergens.length - 1 && styles.activeAllergenRowLast]} 
                                >
                                    <View style={styles.allergenBadge}>
                                        <Ionicons name="alert-circle" size={16} color="#E53935" />
                                    </View>
                                    <Text style={styles.activeAllergenText}>{allergen}</Text>
                                    <View style={styles.allergenIndicator} />
                                </View>
                            ))}
                        </View>
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="medical-outline" size={48} color="#ccc" />
                            <Text style={styles.noAllergens}>No allergens added yet</Text>
                            <Text style={styles.emptyStateSubtext}>
                                Tap <Text style={{ fontWeight: 'bold' }}>Manage</Text> to add allergens
                            </Text>
                        </View>
                    )}
                </View>

                {/* LOGOUT BUTTON */}
                <View style={styles.logoutSection}>
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
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        padding: 16,
        paddingBottom: 24,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
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
        backgroundColor: '#fff',
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
        backgroundColor: '#2196F3',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    title: {
        color: '#333',
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 20,
    },
    profileIconContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    profileIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    profileInitials: {
        fontSize: 24,
        fontWeight: '700',
        color: '#333',
    },
    section: {
        marginBottom: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    editButtonText: {
        color: '#2196F3',
        fontSize: 14,
        fontWeight: '600',
    },
    editActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    cancelButton: {
        borderWidth: 1,
        borderColor: '#ccc',
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 12,
        fontWeight: '600',
    },
    saveButton: {
        backgroundColor: '#2196F3',
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    infoCard: {
        backgroundColor: '#f9f9f9',
        padding: 14,
        borderRadius: 8,
    },
    infoRow: {
        marginBottom: 12,
    },
    infoRowLast: {
        marginBottom: 0,
    },
    label: {
        color: '#666',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
    },
    value: {
        fontSize: 14,
        color: '#333',
    },
    textInput: {
        color: '#333',
        fontSize: 14,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#ddd',
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    manageButton: {
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    manageButtonText: {
        color: '#2196F3',
        fontSize: 12,
        fontWeight: '600',
    },
    //allergenContainer: {
    //    flexDirection: 'row',
    //    flexWrap: 'wrap',
    //    gap: 6,
    //},
    //allergenPill: {
    //    backgroundColor: '#E8F5E9',
    //    paddingHorizontal: 10,
    //    paddingVertical: 4,
    //    borderRadius: 14,
    //},
    //allergenText: {
    //    color: '#2e7d32',
    //    fontSize: 12,
    //    fontWeight: '500',
    //},
    emptyState: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    noAllergens: {
        color: '#999',
        fontSize: 14,
        fontWeight: '600',
        marginTop: 8,
    },
    emptyStateSubtext: {
        fontSize: 12,
        color: '#bbb',
        marginTop: 4,
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#f9f9f9',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
        marginTop: 6,
    },
    statLabel: {
        fontSize: 11,
        color: '#999',
        marginTop: 2,
    },
    activeAllergensCard: {
        backgroundColor: '#fff9e6',
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#E53935',
        overflow: 'hidden',
    },
    activeAllergenRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ffe6e6',
    },
    activeAllergenRowLast: {
        borderBottomWidth: 0,
    },
    allergenBadge: {
        marginRight: 10,
    },
    activeAllergenText: {
        color: '#333',
        fontSize: 14,
        fontWeight: '500',
        flex: 1,
    },
    allergenIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#E53935',
    },
    logoutSection: {
        marginTop: 16, 
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    logoutButton: {
        flexDirection: 'row',
        backgroundColor: '#E53935',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    logoutButtonDisabled: {
        opacity: 0.6,
    },
    logoutButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
});