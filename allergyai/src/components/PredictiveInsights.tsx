import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Prediction {
    allergen: string;
    riskScore: number;
    confidence: number;
    reason: string;
}

interface Props {
    predictions: Prediction[];
}

export default function PredictiveInsights({ predictions }: Props) {
    const getRiskColor = (score: number) => {
        if (score >= 70) return '#F44336';
        if (score >= 50) return '#FF9800';
        return '#FFC107';
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <Text style={styles.title}> Predictive Insights</Text>
                <View style={styles.betaBadge}>
                    <Text style={styles.betaText}>AI</Text>
                </View>
            </View>
            {predictions.length === 0 ? (
                <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>Log meals and symptoms to see predictions</Text>
                </View>
            ) : (
                    predictions.map((pred, index) => (
                        <View key={index} style={styles.predictionCard}>
                            <View style={styles.header}>
                                <Text style={styles.allergen}>{pred.allergen}</Text>
                                <View style={[styles.badge, { backgroundColor: getRiskColor(pred.riskScore) }]}>
                                <Text style={styles.badgeText}>{Math.round(pred.riskScore)}%</Text>
                            </View>
                        </View>
                            <Text style={styles.reason}>{pred.reason}</Text>
                          <Text style={styles.confidence}>Confidence: {pred.confidence}%</Text>
                        </View >
                    ))
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
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
        color: '#212529',
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
        backgroundColor: '#F8F9FA',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    emptyText: {
        color: '#6C757D',
        textAlign: 'center',
        fontSize: 14,
    },
    predictionCard: {
        backgroundColor: '#F8F9FA',
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
        color: '#495057',
        marginBottom: 4,
    },
    confidence: {
        fontSize: 12,
        color: '#6C757D',
    },
});
                              