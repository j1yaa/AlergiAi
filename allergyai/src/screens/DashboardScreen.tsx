import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';

import { getAnalytics, getSymptoms, getMeals } from '../api/client';
import { AnalyticsSummary } from '../types';
import PredictiveInsights from '../components/PredictiveInsights';
import { predictAllergenRisks } from '../utils/predictiveAnalysis';

export default function DashboardScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  console.log('=== DashboardScreen rendered ===');
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
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

      const symptoms = await getSymptoms();
      const meals = await getMeals();
      const predictedRisks = predictAllergenRisks(symptoms.items, meals, []);
      console.log('Predictions calculated:', predictedRisks);
      setPredictions(predictedRisks);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  if (!analytics) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>{t('dashboard.loading')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.welcomeSection}>
        <Text style={[styles.welcomeText, { color: colors.text }]}>{t('dashboard.welcomeBack')}</Text>
        <Text style={[styles.subtitle, { color: colors.icon }]}>{t('dashboard.healthOverview')}</Text>
      </View>
      
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <View style={[styles.statIconContainer, { backgroundColor: `${colors.success}15` }]}>
            <Ionicons name="checkmark-circle" size={24} color={colors.success} />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{analytics.safeMealsPct}%</Text>
          <Text style={[styles.statLabel, { color: colors.icon }]}>{t('dashboard.safeMeals')}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <View style={[styles.statIconContainer, { backgroundColor: `${colors.secondary}15` }]}>
            <Ionicons name="restaurant" size={24} color={colors.secondary} />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{analytics.totalMeals}</Text>
          <Text style={[styles.statLabel, { color: colors.icon }]}>{t('dashboard.totalMeals')}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <View style={[styles.statIconContainer, { backgroundColor: `${colors.warning}15` }]}>
            <Ionicons name="notifications" size={24} color={colors.warning} />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{analytics.totalAlerts}</Text>
          <Text style={[styles.statLabel, { color: colors.icon }]}>{t('dashboard.alerts')}</Text>
        </View>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={[styles.actionCard, { backgroundColor: colors.success }]}
          onPress={() => navigation.navigate('AddMeal' as never)}
        >
          <View style={styles.actionIconContainer}>
            <Ionicons name="restaurant" size={28} color="#FFFFFF" />
          </View>
          <Text style={styles.actionTitle}>{t('dashboard.logMeal')}</Text>
          <Text style={styles.actionSubtitle}>{t('dashboard.trackYourFood')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionCard, { backgroundColor: colors.secondary }]}
          onPress={() => navigation.navigate('Scanner' as never)}
        >
          <View style={styles.actionIconContainer}>
            <Ionicons name="scan" size={28} color="#FFFFFF" />
          </View>
          <Text style={styles.actionTitle}>{t('dashboard.scanFood')}</Text>
          <Text style={styles.actionSubtitle}>{t('dashboard.quickAllergenDetection')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={[styles.actionCard, { backgroundColor: colors.warning }]}
          onPress={() => navigation.navigate('Symptoms' as never)}
        >
          <View style={styles.actionIconContainer}>
            <Ionicons name="fitness" size={28} color="#FFFFFF" />
          </View>
          <Text style={styles.actionTitle}>{t('nav.Symptoms')}</Text>
          <Text style={styles.actionSubtitle}>{t('symptoms.logSymptom')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionCard, { backgroundColor: colors.accent }]}
          onPress={() => navigation.navigate('Trends' as never)}
        >
          <View style={styles.actionIconContainer}>
            <Ionicons name="trending-up" size={28} color="#FFFFFF" />
          </View>
          <Text style={styles.actionTitle}>{t('nav.Trends')}</Text>
          <Text style={styles.actionSubtitle}>{t('trends.trendsInsights')}</Text>
        </TouchableOpacity>
      </View>

      <PredictiveInsights predictions={predictions} />

      <View style={[styles.chartContainer, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
        <View style={styles.chartHeader}>
          <Ionicons name="bar-chart" size={24} color={colors.primary} />
          <Text style={[styles.chartTitle, { color: colors.text }]}>Weekly Exposure</Text>
        </View>
        <View style={styles.chartPlaceholder}>
          {analytics.weeklyExposure.map((item, index) => {
            const maxCount = Math.max(...analytics.weeklyExposure.map(w => w.count), 1);
            const barHeight = Math.max((item.count / maxCount) * 100, 10);
            return (
              <View key={index} style={styles.barWrapper}>
                <Text style={[styles.barValue, { color: colors.text }]}>{item.count}</Text>
                <View style={[
                  styles.bar,
                  {
                    height: barHeight,
                    backgroundColor: item.count > 0 ? colors.error : colors.success
                  }
                ]} />
                <Text style={[styles.barLabel, { color: colors.icon }]}>{item.week}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={[styles.chartContainer, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
        <View style={styles.chartHeader}>
          <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
          <Text style={[styles.chartTitle, { color: colors.text }]}>{t('dashboard.topAllergens')}</Text>
        </View>
        <View style={styles.allergenList}>
          {analytics.topAllergens.map((item, index) => (
            <View key={index} style={[styles.allergenItem, { borderBottomColor: colors.cardBorder }]}>
              <View style={styles.allergenInfo}>
                <Text style={[styles.allergenName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.allergenSubtext, { color: colors.icon }]}>{item.count} {t('dashboard.exposures')}</Text>
              </View>
              <View style={[styles.allergenBadge, { backgroundColor: `${colors.error}15` }]}>
                <Text style={[styles.allergenCount, { color: colors.error }]}>{item.count}</Text>
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
    padding: 20,
  },
  welcomeSection: {
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  actionCard: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
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
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    flex: 1,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  chartContainer: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  chartPlaceholder: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 160,
    paddingTop: 20,
  },
  barWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 32,
    borderRadius: 6,
    marginVertical: 8,
  },
  barValue: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  barLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
  },
  allergenList: {
    paddingVertical: 4,
  },
  allergenItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  allergenInfo: {
    flex: 1,
  },
  allergenName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  allergenSubtext: {
    fontSize: 13,
    fontWeight: '500',
  },
  allergenBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  allergenCount: {
    fontSize: 14,
    fontWeight: '700',
  },
});