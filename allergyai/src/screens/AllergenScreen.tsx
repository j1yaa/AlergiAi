import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { getAllergens, addAllergen, removeAllergen } from '../api/client';

export default function AllergenScreen() {
    const [allergens, setAllergens] = useState<string[]>([]);
    const [newAllergen, setNewAllergen] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAllergens();
    }, []);

    const loadAllergens = async () => {
        setLoading(true);
        try {
            const data = await getAllergens();
            setAllergens(data.allergens);
        } catch (error) {
            console.error('Failed to load allergens:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddAllergen = async () => {
        if (!newAllergen.trim()) return;

        const allergenName = newAllergen.trim();

        if (allergens.some(a => a.toLowerCase() === allergenName.toLowerCase())) {
            Alert.alert('Duplicate', 'This allergen is already in your list');
            return;
        }

        try {
            await addAllergen({ allergen: allergenName });
            setAllergens([...allergens, allergenName]);
            setNewAllergen('');
        } catch (error) {
            Alert.alert('Error', 'Failed to add  allergen');
            console.error('Failed to add allergen:', error);
        }
    };

    const handleRemoveAllergen = async (allergen: string) => {
        Alert.alert(
            'Remove Allergen',
            `WARNING: Removing "${allergen}" from your allergen list means the app will no longer alert you about this ingredient in food products.\n\nThis could put you at risk of accidental exposure. Are you absolutely sure you want to proceed?`,
            [
                { text: 'Cancel', style: 'cancel', onPress: () => console.log('Cancel') },
                {
                    text: 'Remove Anyway',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await removeAllergen({ allergen });
                            setAllergens(allergens.filter(a => a !== allergen));
                            Alert.alert('Success', 'Allergen successfully removed!');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to remove allergen');
                            console.error('Failed to remove allergen:', error);
                        }
                    },
                },
            ],
            {
                cancelable: true,
                onDismiss: () => console.log('Alert dismissed'),
            }
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
            </View>

            <View style={styles.listSection}>
                <Text style={styles.sectionTitle}>
                    Your Allergens ({allergens.length})
                </Text>
                {loading ? (
                    <Text style={styles.loadingText}>Loading..</Text>
                ) : allergens.length > 0 ? (
                    <View style={styles.allergenList}>
                        {allergens.map((allergen, index) => (
                        <View key={index} style={styles.allergenItem}>
                            <View style={styles.allergenPill}>
                                <Text style={styles.allergenText}>{allergen}</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.removeButton}
                                onPress={() => handleRemoveAllergen(allergen)}
                            >
                                    <Text style={styles.removeButtonText}>✕</Text>
                            </TouchableOpacity>
                        </View>
                          ))}
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
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    inputSection: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 15,
        borderRadius: 8,
        fontSize: 16,
        marginRight: 10,
    },
    addButton: {
        backgroundColor: '#2196F3',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderRadius: 8,
    },
    addButtonDisabled: {
        backgroundColor: '#ccc',
    },
    addButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    listSection: {
        marginBottom: 30,
    },
    loadingText: {
        color: '#666',
        textAlign: 'center',
        padding: 20,
    },
    allergenList: {
        gap: 10,
    },
    allergenItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f9f9f9',
        padding: 12,
        borderRadius: 8,
        marginBottom: 10,
    },
    allergenPill: {
        backgroundColor: '#ffebee',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
    },
    allergenText: {
        color: '#d32f2f',
        fontSize: 14,
        fontWeight: 'bold',
    },
    removeButton: {
        backgroundColor: '#ff6b6b',
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    removeButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    emptyState: {
        alignItems: 'center',
        padding: 40,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
    },
    emptyStateText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 5,
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: '#999',
    },
    infoSection: {
        backgroundColor: '#e3f2fd',
        padding: 15,
        borderRadius: 8,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#1976d2',
    },
    commonAllergens: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    commonPill: {
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginRight: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#2196F3',
    },
    commonText: {
        color: '#2196F3',
        fontSize: 14,
    },
});
                  