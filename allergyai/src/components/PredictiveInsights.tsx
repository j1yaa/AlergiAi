import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLanguage } from '../hooks/useLanguage';
import { useTheme } from '../hooks/useTheme';
import { translateAllergen } from '../utils/allergenTranslation';

interface Prediction {
    allergen: string;
    riskScore: number;
    confidence: number;
    reasonKey: 'frequentCorrelation' | 'highSeverity' | 'potentialTrigger';
    reasonCount?: number;
}

interface Props {
    predictions: Prediction[];
}

export default function PredictiveInsights({ predictions }: Props) {
    const { t, language } = useLanguage();
    const { colors } = useTheme();
    const getRiskColor = (score: number) => {
        if (score >= 70) return '#F44336';
        if (score >= 50) return '#FF9800';
        return '#FFC107';
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
            <View style={styles.headerRow}>
                <Text style={[styles.title, { color: colors.text }]}> {t('predictions.title')}</Text>
                <View style={styles.betaBadge}>
                    <Text style={styles.betaText}>AI</Text>
                </View>
            </View>
            {predictions.length === 0 ? (
                <View style={[styles.emptyCard, { backgroundColor: colors.background }]}>
                    <Text style={[styles.emptyText, { color: colors.icon }]}>{t('predictions.emptyText')}</Text>
                </View>
            ) : (
                    predictions.map((pred, index) => (
                        <View key={index} style={[styles.predictionCard, { backgroundColor: colors.background }]}>
                            <View style={styles.header}>
                                <Text style={[styles.allergen, { color: colors.text }]}>{translateAllergen(pred.allergen, language)}</Text>
                                <View style={[styles.badge, { backgroundColor: getRiskColor(pred.riskScore) }]}>
                                <Text style={styles.badgeText}>{Math.round(pred.riskScore)}%</Text>
                            </View>
                        </View>
                            <Text style={[styles.reason, { color: colors.icon }]}>
                                {pred.reasonKey === 'frequentCorrelation'
                                    ? t('predictions.frequentCorrelation', { count: pred.reasonCount })
                                    : pred.reasonKey === 'highSeverity'
                                    ? t('predictions.highSeverity')
                                    : t('predictions.potentialTrigger')}
                            </Text>
                          <Text style={[styles.confidence, { color: colors.icon }]}>{t('predictions.confidence', { percent: pred.confidence })}</Text>
                        </View >
                    ))
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        borderRadius: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        flex: 1,
    },
    betaBadge: {
        backgroundColor: '#9C27B0',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    betaText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    emptyCard: {
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    emptyText: {
        textAlign: 'center',
        fontSize: 14,
    },
    predictionCard: {
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    allergen: {
        fontSize: 16,
        fontWeight: '600',
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    reason: {
        fontSize: 14,
        marginBottom: 4,
    },
    confidence: {
        fontSize: 12,
    },
});
                              