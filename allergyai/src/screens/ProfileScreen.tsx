import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Platform} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getProfile, updateUserSettings } from '../api/client'; 
import { UserProfile } from '../types';
import {isWeb} from '../utils/platform';

export default function ProfileScreen({ navigation }: any) {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState('');
    const [editedEmail, setEditedEmail] = useState('');
    const [saving, setSaving] = useState(false);

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

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    const showAlert = (title: string, message: string) => {
        if (isWeb) {
            window.alert(`${title}: ${message}`);
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
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
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
                        {profile.allergens.map((allergen: string, index: number) => (
                            <View key={index} style={styles.allergenPill}>
                                <Text style={styles.allergenText}>{allergen}</Text>
                            </View>
                        ))}
                    </View>
                ) : (
                    <View style={styles.emptyState}>
                        <Ionicons name="medical-outline" size={48} color="#ccc" />
                    <Text style={styles.noAllergens}>No allergens added yet</Text>
                    <Text style={styles.emptyStateSubtext}>
                         Tap <b>Manage</b> to add allergens
                    </Text>
                    </View>
                )}
            </View>

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
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    contentContainer: {
        padding: 20,
        paddingBottom: 40,
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
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 24,
        color: '#333',
    },
    profileIconContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    profileIcon: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    profileInitials: {
        fontSize: 18,
        fontWeight: '600',
        color: '#666',
    },
    section: {
        marginBottom: 24,
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
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        backgroundColor: '#E3F2FD',
    },
    editButtonText: {
        marginLeft: 4,
        color: '#2196F3',
        fontSize: 14,
        fontWeight: '600',
    },
    editActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
        minWidth: 70,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#f5f5f5',
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 14,
        fontWeight: '600',
    },
    saveButton: {
        backgroundColor: '#2196F3',
    },
    saveButtonDisabled: {
        backgroundColor: '#90CAF9',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    infoCard: {
        backgroundColor: '#f9f9f9',
        padding: 16,
        borderRadius: 12,
    },
    infoRow: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        color: '#666',
        marginBottom: 6,
        fontWeight: '500',
    },
    value: {
        fontSize: 16,
        fontWeight: '400',
        color: '#333',
    },
    textInput: {
        fontSize: 16,
        color: '#333',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 12,
        backgroundColor: '#fff',
        ...Platform.select({
            web: {
                outlineStyle: 'none' as any,
            },
        }),
    },
    manageButton: {
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    manageButtonText: {
        color: '#2196F3',
        fontSize: 14,
        fontWeight: '600',
    },
    allergenContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    allergenPill: {
        backgroundColor: '#FFEBEE',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#FFCDD2',
    },
    allergenText: {
        color: '#C62828',
        fontSize: 14,
        fontWeight: '500',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 32,
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
    },
    noAllergens: {
        color: '#999',
        fontSize: 16,
        fontStyle: 'italic',
        fontWeight: '500',
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: '#bbb',
        marginTop: 4,
        textAlign: 'center',
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