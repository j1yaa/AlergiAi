import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { getMeals, getSymptoms } from '../api/client';
import { Meal, Symptom } from '../types';

const { width } = Dimensions.get('window');

interface CorrelationData {
  allergen: string;
  mealCount: number;
  symptomCount: number;
  correlation: number;
}

export default function SymptomCorrelationScreen() {
  const [loading, setLoading] = useState(true);
  const [correlations, setCorrelations] = useState<CorrelationData[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const meals = await getMeals();
      const symptomsResponse = await getSymptoms();
      const symptoms = symptomsResponse.items;

      const allergenMap: { [key: string]: { mealIds: Set<string>; symptomIds: Set<string> } } = {};

      meals.forEach(meal => {
        let allergens: string[] = [];
        if (Array.isArray(meal.allergens)) {
          allergens = meal.allergens;
        } else if (typeof meal.allergens === 'string') {
          allergens = [meal.allergens];
        } else if (meal.items) {
          allergens = meal.items;
        }

        allergens.forEach(allergen => {
          if (!allergen || typeof allergen !== 'string') return;

          if (!allergenMap[allergen]) {
            allergenMap[allergen] = { mealIds: new Set(), symptomIds: new Set() };
          }
          allergenMap[allergen].mealIds.add(meal.id);

          const mealTime = new Date(meal.timeStamp || meal.createdAt || new Date()).getTime();
          symptoms.forEach(s => {
            const symptomTime = new Date(s.dateISO).getTime();
            const timeDiff = symptomTime - mealTime;
            if (timeDiff > 0 && timeDiff < 24 * 60 * 60 * 1000) {
              allergenMap[allergen].symptomIds.add(s.id);
            }
          });
        });
      });

      const correlationData = Object.entries(allergenMap).map(([allergen, data]) => ({
        allergen,
        mealCount: data.mealIds.size,
        symptomCount: data.symptomIds.size,
        correlation: data.mealIds.size > 0 ? Math.min((data.symptomIds.size / data.mealIds.size) * 100, 100) : 0
      })).sort((a, b) => b.correlation - a.correlation);

      setCorrelations(correlationData);
    } catch (error) {
      console.error('Failed to load correlation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBarColor = (correlation: number) => {
    if (correlation > 70) return '#f44336';
    if (correlation > 40) return '#ff9800';
    return '#4caf50';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Symptom Correlation Analysis</Text>
        <Text style={styles.subtitle}>
          Track patterns between allergen exposure and symptom occurrence
        </Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>How This Works</Text>
        <Text style={styles.infoText}>
          This analysis tracks for meals consumed within 24 hours before each symptom report.
          The correlation percentage shows how often a specific allergen was present when symptoms occurred.
        </Text>
          <Text style={styles.infoExample}>
            Example: 100% means that every time you ate that food, you experienced symptoms within 24 hours.
          </Text>
      </View>

      {correlations.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No correlation data available</Text>
          <Text style={styles.emptySubtext}>
            Log more meals and symptoms to see patterns
          </Text>
        </View>
      ) : (
        <View style={styles.chartContainer}>
          {correlations.map((item: CorrelationData, index: number) => (
            <View key={index} style={styles.barContainer}>
              <View style={styles.labelContainer}>
                <Text style={styles.allergenLabel}>{item.allergen}</Text>
                <Text style={styles.countLabel}>
                  {item.mealCount} meals • {item.symptomCount} symptoms
                </Text>
              </View>
              <View style={styles.barWrapper}>
                <View
                  style={[
                    styles.bar,
                    {
                      width: ((width - 120) * item.correlation) / 100,
                      backgroundColor: getBarColor(item.correlation)
                    }
                  ]}
                />
                <Text style={styles.percentLabel}>
                  {item.correlation.toFixed(0)}%
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Risk Indicators</Text>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#f44336' }]} />
          <Text style={styles.legendText}>High Risk (&gt;70%) - Avoid these allergens</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#ff9800' }]} />
          <Text style={styles.legendText}>Medium Risk (40-70%) - Monitor closely</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#4caf50' }]} />
          <Text style={styles.legendText}>Low Risk (&lt;40%) - Generally safe</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  chartContainer: {
    padding: 20,
  },
  barContainer: {
    marginBottom: 25,
  },
  labelContainer: {
    marginBottom: 8,
  },
  allergenLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  countLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  barWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 30,
    width: '100%',
  },
  bar: {
    height: '100%',
    borderRadius: 4,
    minWidth: 2,
    maxWidth: width - 120,
  },
  percentLabel: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  legend: {
    margin: 20,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 20,
    height: 20,
    borderRadius: 4,
    marginRight: 10,
  },
  legendText: {
    fontSize: 14,
    color: '#666',
  },
  infoCard: {
    margin: 20,
    marginTop: 0,
    padding: 16,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1976D2',
  },
  infoText: {
    fontSize: 14,
    color: '#424242',
    marginBottom: 8,
    lineHeight: 20,
  },
  infoExample: {
    fontSize: 13,
    color: '#616161',
    fontStyle: 'italic',
    lineHeight: 18,
  },
});
