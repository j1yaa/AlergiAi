import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { getAnalytics } from '../api/client';
import { AnalyticsSummary } from '../types';

export default function DashboardScreen() {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      loadAnalytics();
    }, [])
  );

  const loadAnalytics = async () => {
    try {
      const analyticsData = await getAnalytics();
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  if (!analytics) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{analytics.safeMealsPct}%</Text>
          <Text style={styles.statLabel}>Safe Meals</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{analytics.weeklyExposure.reduce((sum, w) => sum + w.count, 0)}</Text>
          <Text style={styles.statLabel}>Weekly Alerts</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{analytics.topAllergens.length}</Text>
          <Text style={styles.statLabel}>Top Allergens</Text>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Weekly Exposure</Text>
        <View style={styles.chartPlaceholder}>
          {analytics.weeklyExposure.map((item, index) => (
            <View key={index} style={styles.barItem}>
              <Text style={styles.barLabel}>{item.week}</Text>
              <View style={[styles.bar, { height: item.count * 20 }]} />
              <Text style={styles.barValue}>{item.count}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Top Allergens</Text>
        <View style={styles.allergenList}>
          {analytics.topAllergens.map((item, index) => (
            <View key={index} style={styles.allergenItem}>
              <Text style={styles.allergenName}>{item.name}</Text>
              <Text style={styles.allergenCount}>{item.count}</Text>
            </View>
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    flexWrap: 'wrap',
  },
  statCard: {
    backgroundColor: '#f5f5f5',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
    flex: 0.31,
    marginBottom: 10,
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
  chartContainer: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  chartPlaceholder: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 150,
    paddingBottom: 20,
  },
  barItem: {
    alignItems: 'center',
  },
  bar: {
    width: 30,
    backgroundColor: '#FF6B6B',
    marginVertical: 5,
    borderRadius: 2,
  },
  barLabel: {
    fontSize: 12,
    color: '#666',
  },
  barValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  allergenList: {
    paddingVertical: 10,
  },
  allergenItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  allergenName: {
    fontSize: 16,
    color: '#333',
  },
  allergenCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
});