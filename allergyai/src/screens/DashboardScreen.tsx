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
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>Welcome back</Text>
        <Text style={styles.subtitle}>Here's your allergy overview</Text>
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

      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={[styles.actionCard, styles.logMealCard]}
          onPress={() => navigation.navigate('AddMeal' as never)}
        >
          <View style={styles.actionIconContainer}>
            <Ionicons name="restaurant" size={28} color="#FFFFFF" />
          </View>
          <Text style={styles.actionTitle}>Log Meal</Text>
          <Text style={styles.actionSubtitle}>Track your food</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionCard, styles.scanCard]}
          onPress={() => navigation.navigate('Scanner' as never)}
        >
          <View style={styles.actionIconContainer}>
            <Ionicons name="camera" size={28} color="#FFFFFF" />
          </View>
          <Text style={styles.actionTitle}>Scan Food</Text>
          <Text style={styles.actionSubtitle}>Check ingredients</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={[styles.actionCard, styles.symptomsCard]}
          onPress={() => navigation.navigate('Symptoms' as never)}
        >
          <View style={styles.actionIconContainer}>
            <Ionicons name="medical" size={28} color="#FFFFFF" />
          </View>
          <Text style={styles.actionTitle}>Symptoms</Text>
          <Text style={styles.actionSubtitle}>Log reactions</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionCard, styles.alertsCard]}
          onPress={() => navigation.navigate('Alerts' as never)}
        >
          <View style={styles.actionIconContainer}>
            <Ionicons name="warning" size={28} color="#FFFFFF" />
          </View>
          <Text style={styles.actionTitle}>Alerts</Text>
          <Text style={styles.actionSubtitle}>View warnings</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Weekly Exposure Trends</Text>
        <View style={styles.chartPlaceholder}>
          {analytics.weeklyExposure.map((item, index) => (
            <View key={index} style={styles.barItem}>
              <Text style={styles.barLabel}>{item.week}</Text>
              <View style={[styles.bar, { height: Math.max(item.count * 20, 5), backgroundColor: item.count > 0 ? '#E53935' : '#4CAF50' }]} />
              <Text style={styles.barValue}>{item.count}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Most Common Allergens</Text>
        <View style={styles.allergenList}>
          {analytics.topAllergens.map((item, index) => (
            <View key={index} style={styles.allergenItem}>
              <View style={styles.allergenInfo}>
                <Text style={styles.allergenName}>{item.name}</Text>
                <Text style={styles.allergenSubtext}>{item.count} exposures</Text>
              </View>
              <View style={styles.allergenBadge}>
                <Text style={styles.allergenCount}>{item.count}</Text>
              </View>
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
    backgroundColor: '#F8F9FA',
    padding: 20,
  },
  welcomeSection: {
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6C757D',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionCard: {
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    flex: 0.48,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  logMealCard: {
    backgroundColor: '#4CAF50',
  },
  scanCard: {
    backgroundColor: '#2196F3',
  },
  symptomsCard: {
    backgroundColor: '#FF9800',
  },
  alertsCard: {
    backgroundColor: '#F44336',
  },
  actionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 20,
    alignItems: 'center',
    flex: 0.31,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#9C27B0',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#9C27B0',
  },
  statLabel: {
    fontSize: 13,
    color: '#6C757D',
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '500',
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 16,
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
    width: 32,
    backgroundColor: '#FF6B6B',
    marginVertical: 8,
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 12,
    color: '#6C757D',
    fontWeight: '500',
  },
  barValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#212529',
  },
  allergenList: {
    paddingVertical: 8,
  },
  allergenItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  allergenInfo: {
    flex: 1,
  },
  allergenName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  allergenSubtext: {
    fontSize: 14,
    color: '#6C757D',
    marginTop: 2,
  },
  allergenBadge: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  allergenCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00C853',
  },
});