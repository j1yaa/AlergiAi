import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

interface RouteParams {
    detectedIngredients: string[];
    allergenWarnings: string[];
    safeIngredients: string[];
    productName: string;
}

export default function ScanResultScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const params = route.params as RouteParams;

    const hasAllergens = params.allergenWarnings.length > 0;

    const handleDone = () => {
        navigation.reset({
            index: 0,
            routes: [{ name: 'MainTabs' as never }],
        });
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={28} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Scan Results</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView style={styles.content}>
                {/* Product Name */}
                <View style={styles.productCard}>
                    <Text style={styles.productName}>{params.productName}</Text>
                </View>

                {/* Allergen Status */}
                <View style={[styles.statusCard, hasAllergens ? styles.dangerCard : styles.safeCard]}>
                    <Ionicons
                        name={hasAllergens ? "warning" : "checkmark-circle"}
                        size={48}
                        color={hasAllergens ? "#f44336" : "#4CAF50"}
                    />
                    <Text style={styles.statusTitle}>
                        {hasAllergens ? "Allergen Detected!" : "Safe to Consume"}
                    </Text>
                    <Text style={styles.statusSubtitle}>
                        {hasAllergens
                            ? `Contains ${params.allergenWarnings.length} allergen(s) from your profile`
                            : "No allergens detected from your profile"
                        }
                    </Text>
                </View>

                {/* Allergen Warnings */}
                {hasAllergens && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>⚠️ Allergen Warnings</Text>
                        {params.allergenWarnings.map((allergen, index) => (
                            <View key={index} style={styles.allergenItem}>
                                <Ionicons name="alert-circle" size={24} color="#f44336" />
                                <Text style={styles.allergenText}>{allergen}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Safe Ingredients */}
                {params.safeIngredients.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>✓ Safe Ingredients</Text>
                        {params.safeIngredients.map((ingredient, index) => (
                            <View key={index} style={styles.safeItem}>
                                <Ionicons name="checkmark-circle-outline" size={20} color="#4CAF50" />
                                <Text style={styles.safeText}>{ingredient}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* All Detected Ingredients */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📋 All Detected Ingredients</Text>
                    <View style={styles.ingredientsList}>
                        {params.detectedIngredients.map((ingredient, index) => (
                            <View key={index} style={styles.ingredientChip}>
                                <Text style={styles.ingredientChipText}>{ingredient}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Note */}
                <View style={styles.noteCard}>
                    <Ionicons name="information-circle-outline" size={20} color="#666" />
                    <Text style={styles.noteText}>
                        Powered by Gemini AI. Results are based on ingredient detection and food.
                    </Text>
                </View>
            </ScrollView>

            {/* Bottom Actions */}
            <View style={styles.bottomActions}>
                <TouchableOpacity
                    style={styles.scanAgainButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="camera" size={20} color="#2196F3" />
                    <Text style={styles.scanAgainText}>Scan Again</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.doneButton}
                    onPress={handleDone}
                >
                    <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    productCard: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        marginBottom: 15,
        alignItems: 'center',
    },
    productName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    statusCard: {
        padding: 30,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 20,
    },
    dangerCard: {
        backgroundColor: '#ffebee',
    },
    safeCard: {
        backgroundColor: '#e8f5e9',
    },
    statusTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginTop: 15,
        marginBottom: 8,
    },
    statusSubtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    section: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 15,
        color: '#333',
    },
    allergenItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 15,
        backgroundColor: '#ffebee',
        borderRadius: 8,
        marginBottom: 8,
    },
    allergenText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#f44336',
        marginLeft: 12,
    },
    safeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        marginBottom: 5,
    },
    safeText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 10,
    },
    ingredientsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    ingredientChip: {
        backgroundColor: '#e3f2fd',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
    },
    ingredientChipText: {
        fontSize: 13,
        color: '#1976d2',
    },
    noteCard: {
        flexDirection: 'row',
        backgroundColor: '#fff9e6',
        padding: 15,
        borderRadius: 8,
        marginBottom: 20,
    },
    noteText: {
        flex: 1,
        fontSize: 13,
        color: '#666',
        marginLeft: 10,
        lineHeight: 18,
    },
    bottomActions: {
        flexDirection: 'row',
        padding: 20,
        paddingBottom: 35,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        gap: 10,
    },
    scanAgainButton: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 15,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#2196F3',
        gap: 8,
    },
    scanAgainText: {
        color: '#2196F3',
        fontSize: 16,
        fontWeight: '600',
    },
    doneButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 15,
        borderRadius: 10,
        backgroundColor: '#2196F3',
    },
    doneButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});