import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Alert } from '../types';

export default function AlertDetailScreen({ route }: any) {
  const { alert }: { alert: Alert } = route.params;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return '#FF6B6B';
      case 'medium': return '#FFA726';
      case 'low': return '#66BB6A';
      default: return '#999';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(alert.severity) }]}>
          <Text style={styles.severityText}>{alert.severity.toUpperCase()}</Text>
        </View>
        <Text style={styles.date}>
          {new Date(alert.dateISO).toLocaleString()}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Alert Details</Text>
        <Text style={styles.note}>{alert.note}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Allergens Detected</Text>
        {alert.allergens.length > 0 ? (
          <View style={styles.allergenContainer}>
            {alert.allergens.map((allergen, index) => (
              <View key={index} style={styles.allergenPill}>
                <Text style={styles.allergenText}>{allergen}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.noAllergens}>No allergens detected</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Meal ID</Text>
        <Text style={styles.mealId}>{alert.mealId}</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  severityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  severityText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  date: {
    color: '#666',
    fontSize: 14,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  note: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
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
    color: '#4caf50',
    fontSize: 16,
    fontStyle: 'italic',
  },
  mealId: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'monospace',
  },
});