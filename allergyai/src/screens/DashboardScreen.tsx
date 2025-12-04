import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { getAnalytics } from '../api/client';
import { AnalyticsSummary } from '../types';

export default function DashboardScreen() {
  console.log('=== DashboardScreen rendered ===');
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const navigation = useNavigation();

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
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <TouchableOpacity 
          style={styles.quickLogButton}
          onPress={() => navigation.navigate('AddMeal' as never)}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.quickLogText}>Log Meal</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{analytics.safeMealsPct}%</Text>
          <Text style={styles.statLabel}>Safe Meals</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{analytics.totalMeals}</Text>
          <Text style={styles.statLabel}>Total Meals</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{analytics.totalAlerts}</Text>
          <Text style={styles.statLabel}>Alerts</Text>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Weekly Exposure</Text>
        <View style={styles.chartPlaceholder}>
          {analytics.weeklyExposure.map((item, index) => (
            <View key={index} style={styles.barItem}>
              <Text style={styles.barLabel}>{item.week}</Text>
              <View style={[styles.bar, { height: Math.min(Math.max(item.count * 15, 5), 100), backgroundColor: item.count > 0 ? '#E53935' : '#4CAF50' }]} />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  quickLogButton: {
    backgroundColor: '#1E88E5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  quickLogText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
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
    marginBottom: 20,
    overflow: 'hidden',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  chartPlaceholder: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
    paddingBottom: 20,
    paddingHorizontal: 10,
  },
  barItem: {
    alignItems: 'center',
    flex: 1,
    maxWidth: 60,
  },
  bar: {
    width: 25,
    backgroundColor: '#FF6B6B',
    marginVertical: 5,
    borderRadius: 2,
  },
  barLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
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