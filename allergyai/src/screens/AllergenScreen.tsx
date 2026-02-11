import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { getAllergens, addAllergen, removeAllergen } from '../api/client';
import {isWeb } from '../utils/platform';   

export default function AllergenScreen() {
    const [allergens, setAllergens] = useState<string[]>([]);
    const [allergensSeverity, setAllergensSeverity] = useState<any[]>([]);
    const [newAllergen, setNewAllergen] = useState('');
    const [selectedSeverity, setSelectedSeverity] = useState<'low' | 'moderate' | 'high'>('moderate');
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
        if (!newAllergen.trim()) return;

        const allergenName = newAllergen.trim();

        if (allergens.some((a: string) => a.toLowerCase() === allergenName.toLowerCase())) {
            showAlert('Duplicate', 'This allergen is already in your list');
            return;
        }

        // Optimistic update - update UI immediately
        setAllergens([...allergens, allergenName]);
        setAllergensSeverity([...allergensSeverity, { name: allergenName, severity: selectedSeverity }]);
        setNewAllergen('');
        
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
                        placeholder="Enter name for the allergen:"
                        value={newAllergen}
                        onChangeText={setNewAllergen}
                        autoCapitalize="words"
                    />
                    <TouchableOpacity
                        style={[styles.addButton, !newAllergen.trim() && styles.addButtonDisabled]}
                        onPress={handleAddAllergen}
                        disabled={!newAllergen.trim()}
                    >
                        <Text style={styles.addButtonText}>Add</Text>
                    </TouchableOpacity>
                </View>
                
                <View style={styles.severitySection}>
                    <Text style={styles.severityLabel}>Reaction Severity:</Text>
                    <View style={styles.severityButtons}>
                        {(['low', 'moderate', 'high'] as const).map((severity) => (
                            <TouchableOpacity
                                key={severity}
                                style={[
                                    styles.severityButton,
                                    selectedSeverity === severity && styles.severityButtonActive,
                                    severity === 'low' && styles.severityLow,
                                    severity === 'moderate' && styles.severityModerate,
                                    severity === 'high' && styles.severityHigh,
                                ]}
                                onPress={() => setSelectedSeverity(severity)}
                            >
                                <Text style={[
                                    styles.severityButtonText,
                                    selectedSeverity === severity && styles.severityButtonTextActive
                                ]}>
                                    {severity.charAt(0).toUpperCase() + severity.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <Text style={styles.severityDescription}>
                        {selectedSeverity === 'low' && 'Mild reactions (discomfort, minor symptoms)'}
                        {selectedSeverity === 'moderate' && 'Moderate reactions (noticeable symptoms, some distress)'}
                        {selectedSeverity === 'high' && 'Severe reactions (anaphylaxis, life-threatening)'}
                    </Text>
                </View>
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
                            const severityInfo = allergensSeverity.find((a: any) => a.name.toLowerCase() === allergen.toLowerCase());
                            const severity = severityInfo?.severity || 'moderate';
                            const colors = {
                                low: { bg: '#E8F5E9', border: '#C8E6C9', text: '#2E7D32' },
                                moderate: { bg: '#FFF3E0', border: '#FFE0B2', text: '#E65100' },
                                high: { bg: '#FFEBEE', border: '#FFCDD2', text: '#C62828' }
                            };
                            const color = colors[severity];
                            return (
                                <View key={index} style={styles.allergenItem}>
                                    <View style={[styles.allergenPill, { backgroundColor: color.bg, borderColor: color.border }]}>
                                        <Text style={[styles.allergenText, { color: color.text }]}>{allergen}</Text>
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
    severitySection: {
        marginTop: 16,
        padding: 16,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
    },
    severityLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
        color: '#333',
    },
    severityButtons: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 8,
    },
    severityButton: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#ddd',
        backgroundColor: '#fff',
        alignItems: 'center',
    },
    severityButtonActive: {
        borderColor: '#2196F3',
        backgroundColor: '#2196F3',
    },
    severityLow: {
        borderColor: '#4CAF50',
    },
    severityModerate: {
        borderColor: '#FF9800',
    },
    severityHigh: {
        borderColor: '#f44336',
    },
    severityButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
    },
    severityButtonTextActive: {
        color: '#fff',
    },
    severityDescription: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
        textAlign: 'center',
    },
});
                  