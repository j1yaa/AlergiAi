import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { getAnalytics } from '../api/client';
import { AnalyticsSummary } from '../types';
import { getMealAnalytics, MealAnalytics } from '../utils/mealAnalytics';

export default function DashboardScreen() {
  console.log('=== DashboardScreen rendered ===');
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [mealAnalytics, setMealAnalytics] = useState<MealAnalytics | null>(null);
  const navigation = useNavigation();

  useFocusEffect(
    React.useCallback(() => {
      loadAnalytics();
    }, [])
  );

  const loadAnalytics = async () => {
    try {
      const [analyticsData, mealData] = await Promise.all([
        getAnalytics(),
        getMealAnalytics()
      ]);
      setAnalytics(analyticsData);
      setMealAnalytics(mealData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  if (!analytics || !mealAnalytics) {
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
          onPress={() => navigation.navigate('MealLog' as never)}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.quickLogText}>Log Meal</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{mealAnalytics.safePercentage}%</Text>
          <Text style={styles.statLabel}>Safe Meals</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{mealAnalytics.totalMeals}</Text>
          <Text style={styles.statLabel}>Total Meals</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{mealAnalytics.riskMeals}</Text>
          <Text style={styles.statLabel}>Risk Meals</Text>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Weekly Risk Exposure</Text>
        <View style={styles.chartPlaceholder}>
          {mealAnalytics.weeklyExposure.map((item, index) => (
            <View key={index} style={styles.barItem}>
              <Text style={styles.barLabel}>{item.week}</Text>
              <View style={[styles.bar, { height: Math.max(item.riskCount * 20, 5), backgroundColor: item.riskCount > 0 ? '#E53935' : '#4CAF50' }]} />
              <Text style={styles.barValue}>{item.riskCount}</Text>
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