import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getProfile, updateUserSettings } from '../api/client'; 
import { UserProfile } from '../types';

export default function ProfileScreen({ navigation }: any) {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState('');
    const [editedEmail, setEditedEmail] = useState('');

    useEffect(() => { loadProfile(); }, []);

    const loadProfile = async () => {
        setLoading(true);
        try {
            const data = await getProfile();
            setProfile(data);
            setEditedName(data.name);
            setEditedEmail(data.email);
        } catch (error) {
            console.error('Failed to load the profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!profile) return;

        try {
            // Update profile data locally
            const updatedProfile = {
                ...profile,
                name: editedName,
                email: editedEmail
            };
            setProfile(updatedProfile);

            // Call API to update the user settings
            await updateUserSettings({
                name: editedName,
                email: editedEmail,
                allergens: profile.allergens,
                diet: '',
                notifications: true,
            });
            
            setIsEditing(false);
            Alert.alert('Success', 'Profile was successfully updated!');
        } catch (error) {
            console.error('Failed to update the profile:', error);
            Alert.alert('Error', 'Failed to update the profile. Please try again.');
            
            // Revert the changes when theres an error
            setEditedName(profile.name);
            setEditedEmail(profile.email);
        }
    };
    
    const handleCancel = () => {
        if (profile) {
            setEditedName(profile.name);
            setEditedEmail(profile.email);
        }
        setIsEditing(false);
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

            {/* PROFILE ICON SECTIOn*/}
            <View style={styles.profileIconContainer}>
                <View style={styles.profileIcon}>
                    <Ionicons name="person" size={60} color="#666" />
                </View>
                <Text style={styles.profileInitials}>
                    {profile.name.split(' ').map(n => n[0]).join('').toUpperCase()}
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
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.saveButton]}
                                onPress={handleSave}
                            >
                                <Text style={styles.saveButtonText}>Save</Text>
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
        textAlign: 'center',
    },
    profileIconContainer: {
        alignItems: 'center',
        marginBottom: 30,
        position: 'relative',
    },
    profileIcon: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#e0e0e0',
    },
    profileInitials: {
        position: 'absolute',
        fontSize: 24,
        fontWeight: 'bold',
        color: '#666',
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
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#2196F3',
    },
    editButtonText: {
        color: '#2196F3',
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    editActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
        minWidth: 70,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    saveButton: {
        backgroundColor: '#2196F3',
    },
    cancelButtonText: {
        color: '#666',
        fontWeight: 'bold',
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    infoCard: {
        backgroundColor: '#f5f5f5',
        padding: 15,
        borderRadius: 8,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    label: {
        fontSize: 14,
        color: '#666',
        flex: 1,
    },
    value: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        flex: 2,
        textAlign: 'right',
    },
    textInput: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        flex: 2,
        textAlign: 'right',
        backgroundColor: '#fff',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#ddd',
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
        textAlign: 'center',
        paddingVertical: 20,
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