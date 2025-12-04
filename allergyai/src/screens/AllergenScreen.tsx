import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAllergens, addAllergen, removeAllergen } from '../api/client';
import {isWeb } from '../utils/platform';
import { AllergenWithSeverity } from '../types';
import { DEMO_MODE } from '../config/demo';   

export default function AllergenScreen() {
    const [allergens, setAllergens] = useState<string[]>([]);
    const [allergensSeverity, setAllergensSeverity] = useState<AllergenWithSeverity[]>([]);
    const [newAllergen, setNewAllergen] = useState('');
    const [selectedSeverity, setSelectedSeverity] = useState<'low' | 'moderate' | 'high'>('moderate');
    const [showSeverityModal, setShowSeverityModal] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAllergens();
    }, []);

    const showAlert = (title: string, message: string, buttons?: any[]) => {
        Alert.alert(title, message, buttons);
    };

    const loadAllergens = async () => {
        setLoading(true);
        try {
            const data = await getAllergens();
            setAllergens(data.allergens);
            setAllergensSeverity(data.allergensSeverity || []);
        } catch (error) {
            console.error('Failed to load allergens:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddAllergen = async () => {
        if (!newAllergen.trim()) {
            showAlert('Error', 'Please enter an allergen name');
            return;
        }

        const allergenName = newAllergen.trim();

        if (allergens.some((a: string) => a.toLowerCase() === allergenName.toLowerCase())) {
            showAlert('Duplicate', 'This allergen is already in your list');
            return;
        }

        // Optimistic update - update UI immediately
        setAllergens([...allergens, allergenName]);
        setAllergensSeverity([...allergensSeverity, { name: allergenName, severity: selectedSeverity }]);
        setNewAllergen('');
        setSelectedSeverity('moderate');
        
        // Save to backend in background
        try {
            await addAllergen({ allergen: allergenName, severity: selectedSeverity });
        } catch (error) {
            // Revert on error
            setAllergens(allergens);
            setAllergensSeverity(allergensSeverity);
            showAlert('Error', 'Failed to add allergen');
            console.error('Failed to add allergen:', error);
        }
    };

    const handleRemoveAllergen = async (allergen: string) => {
        showAlert(
            'Remove Allergen',
            `WARNING: Removing "${allergen}" from your allergen list means the app will no longer alert you about this ingredient in food products.\n\nThis could put you at risk of accidental exposure. Are you absolutely sure you want to proceed?`,
            [
                { text: 'Cancel', style: 'cancel', onPress: () => console.log('Cancel') },
                {
                    text: 'Remove Anyway',
                    style: 'destructive',
                    onPress: async () => {
                        // Optimistic update - remove immediately
                        const originalAllergens = allergens;
                        setAllergens(allergens.filter((a: string) => a !== allergen));
                        
                        try {
                            await removeAllergen({ allergen });
                            showAlert('Success', 'Allergen successfully removed!');
                        } catch (error) {
                            // Revert on error
                            setAllergens(originalAllergens);
                            showAlert('Error', 'Failed to remove allergen');
                            console.error('Failed to remove allergen:', error);
                        }
                    },
                },
            ]
        );
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Manage Allergens</Text>

            <View style={styles.inputSection}>
                <Text style={styles.sectionTitle}>Add New Allergen</Text>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter allergen name..."
                        value={newAllergen}
                        onChangeText={setNewAllergen}
                        autoCapitalize="words"
                    />
                </View>
                
                <Text style={styles.severityLabel}>Risk Level</Text>
                <TouchableOpacity
                    style={styles.severitySelector}
                    onPress={() => setShowSeverityModal(true)}
                >
                    <Text style={styles.severityText}>
                        {selectedSeverity === 'low' && '🟢 Low Risk'}
                        {selectedSeverity === 'moderate' && '🟡 Moderate Risk'}
                        {selectedSeverity === 'high' && '🔴 High Risk'}
                    </Text>
                    <Text style={styles.dropdownArrow}>▼</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                    style={[styles.addButton, (!newAllergen.trim()) && styles.addButtonDisabled]}
                    onPress={handleAddAllergen}
                    disabled={!newAllergen.trim()}
                >
                    <Text style={styles.addButtonText}>Add Allergen</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.listSection}>
                <Text style={styles.sectionTitle}>
                    Your Allergens ({allergens.length})
                </Text>
                {loading ? (
                    <Text style={styles.loadingText}>Loading..</Text>
                ) : allergens.length > 0 ? (
                    <View style={styles.allergenList}>
                        {allergens.map((allergen: string, index: number) => {
                            const severityData = allergensSeverity.find(a => a.name === allergen);
                            const severity = severityData?.severity || 'moderate';
                            return (
                                <View key={index} style={styles.allergenItem}>
                                    <View style={styles.allergenInfo}>
                                        <View style={[styles.allergenPill, 
                                            severity === 'low' && styles.lowRiskPill,
                                            severity === 'moderate' && styles.moderateRiskPill,
                                            severity === 'high' && styles.highRiskPill
                                        ]}>
                                            <Text style={[styles.allergenText,
                                                severity === 'low' && styles.lowRiskText,
                                                severity === 'moderate' && styles.moderateRiskText,
                                                severity === 'high' && styles.highRiskText
                                            ]}>{allergen}</Text>
                                        </View>
                                        <Text style={styles.severityBadge}>
                                            {severity === 'low' && '🟢 Low'}
                                            {severity === 'moderate' && '🟡 Moderate'}
                                            {severity === 'high' && '🔴 High'}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.removeButton}
                                        onPress={() => handleRemoveAllergen(allergen)}
                                    >
                                        <Text style={styles.removeButtonText}>✕</Text>
                                    </TouchableOpacity>
                                </View>
                            );
                        })}
                    </View>
                ) : (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>No allergens added</Text>
                        <Text style={styles.emptyStateSubtext}>
                            Add allergens to track them in your meals
                        </Text>
                    </View>
                )}
            </View>

            <View style={styles.infoSection}>
                <Text style={styles.infoTitle}>Common Allergens</Text>
                <View style={styles.commonAllergens}>
                    {['Peanuts', 'Tree Nuts', 'Milk', 'Eggs', 'Shellfish', 'Fish', 'Soy', 'Wheat'].map((common, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.commonPill}
                            onPress={() => setNewAllergen(common)}
                        >
                            <Text style={styles.commonText}>{common}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
            
            <Modal
                visible={showSeverityModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowSeverityModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Risk Level</Text>
                        
                        <TouchableOpacity
                            style={[styles.severityOption, selectedSeverity === 'low' && styles.selectedOption]}
                            onPress={() => {
                                setSelectedSeverity('low');
                                setShowSeverityModal(false);
                            }}
                        >
                            <Text style={styles.severityOptionText}>🟢 Low Risk</Text>
                            <Text style={styles.severityDescription}>Mild reactions, manageable symptoms</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            style={[styles.severityOption, selectedSeverity === 'moderate' && styles.selectedOption]}
                            onPress={() => {
                                setSelectedSeverity('moderate');
                                setShowSeverityModal(false);
                            }}
                        >
                            <Text style={styles.severityOptionText}>🟡 Moderate Risk</Text>
                            <Text style={styles.severityDescription}>Noticeable reactions, requires caution</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            style={[styles.severityOption, selectedSeverity === 'high' && styles.selectedOption]}
                            onPress={() => {
                                setSelectedSeverity('high');
                                setShowSeverityModal(false);
                            }}
                        >
                            <Text style={styles.severityOptionText}>🔴 High Risk</Text>
                            <Text style={styles.severityDescription}>Severe reactions, avoid completely</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => setShowSeverityModal(false)}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 24,
        color: '#333',
    },
    inputSection: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
        color: '#333',
    },
    inputContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fff',
        ...Platform.select({
            web: {outlineStyle: 'none' as any,
            },
        }),
    },
    addButton: {
        backgroundColor: '#2196F3',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButtonDisabled: {
        backgroundColor: '#90CAF9',
        opacity: 0.6,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    listSection: {
        marginBottom: 32,
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        paddingVertical: 20,
    },
    allergenList: {
        gap: 12,
    },
    allergenItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f9f9f9',
        padding: 12,
        borderRadius: 8,
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
        fontSize: 16,
        fontWeight: '500',
    },
    removeButton: {
        backgroundColor: '#FFCDD2',
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    removeButtonText: {
        color: '#C62828',
        fontSize: 18,
        fontWeight: 'bold',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
    },
    emptyStateText: {
        fontSize: 16,
        color: '#999',
        fontWeight: '500',
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: '#bbb',
        marginTop: 8,
        textAlign: 'center',
    },
    infoSection: {
        marginBottom: 32,
    },
    infoTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
        color: '#333',
    },
    commonAllergens: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    commonPill: {
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#BBDEFB',
    },
    commonText: {
        color: '#1976D2',
        fontSize: 14,
        fontWeight: '500',
    },
    severityLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        marginTop: 16,
        color: '#333',
    },
    severitySelector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        backgroundColor: '#fff',
    },
    severityText: {
        fontSize: 16,
        color: '#333',
    },
    dropdownArrow: {
        fontSize: 12,
        color: '#666',
    },
    allergenInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    severityBadge: {
        fontSize: 12,
        fontWeight: '500',
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        width: '80%',
        maxWidth: 300,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
        color: '#333',
    },
    severityOption: {
        padding: 16,
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    selectedOption: {
        backgroundColor: '#E3F2FD',
        borderColor: '#2196F3',
    },
    severityOptionText: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    severityDescription: {
        fontSize: 14,
        color: '#666',
    },
    cancelButton: {
        padding: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 16,
    },
});
                  