import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAllergens, addAllergen, removeAllergen, updateAllergenSeverity } from '../api/client';
import {isWeb } from '../utils/platform';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';

export default function AllergenScreen() {
    const { colors } = useTheme();
    const { t } = useLanguage();
    const [allergens, setAllergens] = useState<string[]>([]);
    const [allergensSeverity, setAllergensSeverity] = useState<any[]>([]);
    const [newAllergen, setNewAllergen] = useState('');
    const [selectedSeverity, setSelectedSeverity] = useState<'minimal' | 'low' | 'moderate' | 'high' | 'severe'>('moderate');
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
            showAlert(t('allergen.duplicate'), t('allergen.alreadyInList'));
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
            showAlert(t('common.error'), t('allergen.failedToAdd'));
            console.error('Failed to add allergen:', error);
        }
    };

    const handleUpdateSeverity = (allergen: string, currentSeverity: string) => {
        const levels = ['minimal', 'low', 'moderate', 'high', 'severe'] as const;
        Alert.alert(
            t('allergen.changeSeverity'),
            `${allergen}`,
            [
                ...levels.map(level => ({
                    text: `${level === currentSeverity ? '✓ ' : ''}${t('allergen.' + level)}`,
                    onPress: async () => {
                        if (level === currentSeverity) return;
                        setAllergensSeverity(prev =>
                            prev.map(a => a.name.toLowerCase() === allergen.toLowerCase() ? { ...a, severity: level } : a)
                        );
                        try {
                            await updateAllergenSeverity(allergen, level);
                        } catch {
                            loadAllergens();
                            showAlert(t('common.error'), t('allergen.failedToUpdate'));
                        }
                    }
                })),
                { text: t('common.cancel'), style: 'cancel' }
            ]
        );
    };

    const handleRemoveAllergen = async (allergen: string) => {
        showAlert(
            t('allergen.removeAllergen'),
            t('allergen.removeWarning', { name: allergen }),
            [
                { text: t('common.cancel'), style: 'cancel', onPress: () => console.log('Cancel') },
                {
                    text: t('allergen.remove'),
                    style: 'destructive',
                    onPress: async () => {
                        // Optimistic update - remove immediately
                        const originalAllergens = allergens;
                        setAllergens(allergens.filter((a: string) => a !== allergen));
                        
                        try {
                            await removeAllergen({ allergen });
                            showAlert(t('common.success'), t('allergen.allergenRemoved'));
                        } catch (error) {
                            // Revert on error
                            setAllergens(originalAllergens);
                            showAlert(t('common.error'), t('allergen.failedToRemove'));
                            console.error('Failed to remove allergen:', error);
                        }
                    },
                },
            ]
        );
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <Text style={[styles.title, { color: colors.text }]}>{t('allergen.manageAllergens')}</Text>

            <View style={styles.inputSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('allergen.addNewAllergen')}</Text>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.icon + '40', color: colors.text }]}
                        placeholder={t('allergen.enterAllergenName')}
                        placeholderTextColor={colors.icon}
                        value={newAllergen}
                        onChangeText={setNewAllergen}
                        autoCapitalize="words"
                    />
                    <TouchableOpacity
                        style={[styles.addButton, { backgroundColor: colors.primary }, !newAllergen.trim() && styles.addButtonDisabled]}
                        onPress={handleAddAllergen}
                        disabled={!newAllergen.trim()}
                    >
                        <Text style={styles.addButtonText}>{t('allergen.add')}</Text>
                    </TouchableOpacity>
                </View>
                
                <View style={[styles.severitySection, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.severityLabel, { color: colors.text }]}>{t('allergen.reactionSeverity')}</Text>
                    <View style={styles.severityButtons}>
                        {(['minimal', 'low', 'moderate', 'high', 'severe'] as const).map((severity) => (
                            <TouchableOpacity
                                key={severity}
                                style={[
                                    styles.severityButton,
                                    { backgroundColor: colors.background, borderColor: colors.icon + '40' },
                                    selectedSeverity === severity && styles.severityButtonActive,
                                    severity === 'minimal' && styles.severityMinimal,
                                    severity === 'low' && styles.severityLow,
                                    severity === 'moderate' && styles.severityModerate,
                                    severity === 'high' && styles.severityHigh,
                                    severity === 'severe' && styles.severitySevere,
                                ]}
                                onPress={() => setSelectedSeverity(severity)}
                            >
                                <Text style={[
                                    styles.severityButtonText,
                                    { color: colors.text },
                                    selectedSeverity === severity && styles.severityButtonTextActive
                                ]}>
                                    {t('allergen.' + severity)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <Text style={[styles.severityDescription, { color: colors.icon }]}>
                        {selectedSeverity === 'minimal' && t('allergen.minimalReactions')}
                        {selectedSeverity === 'low' && t('allergen.mildReactions')}
                        {selectedSeverity === 'moderate' && t('allergen.moderateReactions')}
                        {selectedSeverity === 'high' && t('allergen.severeReactions')}
                        {selectedSeverity === 'severe' && t('allergen.criticalReactions')}
                    </Text>
                </View>
            </View>

            <View style={styles.listSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    {t('allergen.yourAllergens')} ({allergens.length})
                </Text>
                {loading ? (
                    <Text style={[styles.loadingText, { color: colors.icon }]}>{t('allergen.loading')}</Text>
                ) : allergens.length > 0 ? (
                    <View style={styles.allergenList}>
                        {allergens.map((allergen: string, index: number) => {
                            const severityInfo = allergensSeverity.find((a: any) => a.name.toLowerCase() === allergen.toLowerCase());
                            const severity = severityInfo?.severity || 'moderate';
                            const SEVERITY_CONFIG = {
                                minimal: { border: '#8BC34A', badge: '#F1F8E9', badgeBorder: '#8BC34A', text: '#33691E', icon: 'checkmark-circle' as const, label: t('allergen.minimal') },
                                low:     { border: '#4CAF50', badge: '#E8F5E9', badgeBorder: '#4CAF50', text: '#1B5E20', icon: 'alert-circle' as const,     label: t('allergen.low') },
                                moderate:{ border: '#FF9800', badge: '#FFF3E0', badgeBorder: '#FF9800', text: '#E65100', icon: 'warning' as const,           label: t('allergen.moderate') },
                                high:    { border: '#F44336', badge: '#FFEBEE', badgeBorder: '#F44336', text: '#B71C1C', icon: 'flame' as const,             label: t('allergen.high') },
                                severe:  { border: '#880E4F', badge: '#FCE4EC', badgeBorder: '#880E4F', text: '#880E4F', icon: 'nuclear' as const,           label: t('allergen.severe') },
                            };
                            const cfg = SEVERITY_CONFIG[severity as keyof typeof SEVERITY_CONFIG];
                            return (
                                <View key={index} style={[styles.allergenItem, { backgroundColor: colors.surface, borderLeftColor: cfg.border }]}>
                                    <View style={styles.allergenItemLeft}>
                                        <Text style={[styles.allergenName, { color: colors.text }]}>{allergen}</Text>
                                        <TouchableOpacity
                                            style={[styles.severityBadge, { backgroundColor: cfg.badge, borderColor: cfg.badgeBorder }]}
                                            onPress={() => handleUpdateSeverity(allergen, severity)}
                                        >
                                            <Ionicons name={cfg.icon} size={12} color={cfg.text} />
                                            <Text style={[styles.severityBadgeText, { color: cfg.text }]}>{cfg.label}</Text>
                                            <Ionicons name="chevron-down" size={11} color={cfg.text} />
                                        </TouchableOpacity>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.removeButton}
                                        onPress={() => handleRemoveAllergen(allergen)}
                                    >
                                        <Ionicons name="trash-outline" size={18} color="#EF5350" />
                                    </TouchableOpacity>
                                </View>
                            );
                        })}
                    </View>
                ) : (
                    <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.emptyStateText, { color: colors.icon }]}>{t('allergen.emptyState')}</Text>
                        <Text style={[styles.emptyStateSubtext, { color: colors.icon }]}>
                            {t('allergen.addYourFirst')}
                        </Text>
                    </View>
                )}
            </View>

            <View style={styles.infoSection}>
                <Text style={[styles.infoTitle, { color: colors.text }]}>{t('allergen.commonAllergens')}</Text>
                <View style={styles.commonAllergens}>
                    {['Peanuts', 'Tree Nuts', 'Milk', 'Eggs', 'Shellfish', 'Fish', 'Soy', 'Wheat'].map((common, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[styles.commonPill, { backgroundColor: colors.primary + '20', borderColor: colors.primary + '40' }]}
                            onPress={() => setNewAllergen(common)}
                        >
                            <Text style={[styles.commonText, { color: colors.primary }]}>{common}</Text>
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
        padding: 14,
        paddingLeft: 16,
        borderRadius: 12,
        borderLeftWidth: 4,
    },
    allergenItemLeft: {
        flex: 1,
        gap: 6,
    },
    allergenName: {
        fontSize: 16,
        fontWeight: '600',
    },
    severityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 1,
    },
    severityBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.4,
    },
    removeButton: {
        padding: 6,
        marginLeft: 8,
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
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 8,
    },
    severityButton: {
        width: '30%',
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#ddd',
        backgroundColor: '#fff',
        alignItems: 'center',
    },
    severityButtonActive: {
        borderWidth: 3,
        backgroundColor: '#fff',
    },
    severityMinimal: {
        borderColor: '#9CCC65',
    },
    severityLow: {
        borderColor: '#66BB6A',
    },
    severityModerate: {
        borderColor: '#FFA726',
    },
    severityHigh: {
        borderColor: '#EF5350',
    },
    severitySevere: {
        borderColor: '#AD1457',
    },
    severityButtonText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#666',
    },
    severityButtonTextActive: {
        color: '#666',
    },
    severityDescription: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
        textAlign: 'center',
    },
});
                  