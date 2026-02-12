import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { getMealTrends } from '../api/client';

const { width } = Dimensions.get('window');

interface DailyMeal {
  day: string;
  count: number;
}

interface TopAllergen {
  name: string;
  count: number;
}

interface TrendsData {
  dailyMeals: DailyMeal[];
  topAllergens: TopAllergen[];
  reactionsThisWeek: number;
  reactionsLastWeek: number;
}

export default function MealTrendsScreen() {
  const { colors } = useTheme();
  const [trends, setTrends] = useState<TrendsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrends();
  }, []);

  const loadTrends = async () => {
    try {
      const data = await getMealTrends();
      setTrends(data);
    } catch (error) {
      console.error('Failed to load trends:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !trends) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Loading trends...</Text>
      </View>
    );
  }

  const maxMeals = Math.max(...trends.dailyMeals.map(d => d.count), 1);
  const maxAllergens = Math.max(...trends.topAllergens.map(a => a.count), 1);
  const reactionChange = trends.reactionsLastWeek > 0 
    ? Math.round(((trends.reactionsLastWeek - trends.reactionsThisWeek) / trends.reactionsLastWeek) * 100)
    : 0;

  // Calculate insights
  const totalMealsThisWeek = trends.dailyMeals.reduce((sum, d) => sum + d.count, 0);
  const symptomFreeDays = 7 - trends.reactionsThisWeek;
  const alertLevel = trends.reactionsThisWeek >= 4 ? 'high' : trends.reactionsThisWeek >= 2 ? 'medium' : 'low';

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Quick Insights */}
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="bulb" size={24} color={colors.warning} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>Quick Insights</Text>
        </View>
        
        <View style={styles.insightsList}>
          {trends.reactionsThisWeek > 0 && (
            <View style={[styles.insightItem, { 
              backgroundColor: alertLevel === 'high' ? '#FFEBEE' : alertLevel === 'medium' ? '#FFF3E0' : '#E8F5E9' 
            }]}>
              <Ionicons 
                name={alertLevel === 'high' ? 'warning' : alertLevel === 'medium' ? 'alert-circle' : 'checkmark-circle'} 
                size={20} 
                color={alertLevel === 'high' ? '#F44336' : alertLevel === 'medium' ? '#FF9800' : '#4CAF50'} 
              />
              <Text style={[styles.insightText, { 
                color: alertLevel === 'high' ? '#F44336' : alertLevel === 'medium' ? '#FF9800' : '#4CAF50' 
              }]}>
                {trends.reactionsThisWeek} reaction{trends.reactionsThisWeek > 1 ? 's' : ''} this week - {alertLevel === 'high' ? 'High Alert' : alertLevel === 'medium' ? 'Moderate' : 'Low Risk'}
              </Text>
            </View>
          )}
          
          {symptomFreeDays > 0 && (
            <View style={[styles.insightItem, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="happy" size={20} color="#4CAF50" />
              <Text style={[styles.insightText, { color: '#4CAF50' }]}>
                {symptomFreeDays} symptom-free day{symptomFreeDays > 1 ? 's' : ''} this week
              </Text>
            </View>
          )}
          
          <View style={[styles.insightItem, { backgroundColor: '#E3F2FD' }]}>
            <Ionicons name="restaurant" size={20} color="#2196F3" />
            <Text style={[styles.insightText, { color: '#2196F3' }]}>
              {totalMealsThisWeek} meals logged this week
            </Text>
          </View>
          
          {trends.topAllergens.length > 0 && trends.topAllergens[0].count > 0 && (
            <View style={[styles.insightItem, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="alert-circle" size={20} color="#FF9800" />
              <Text style={[styles.insightText, { color: '#FF9800' }]}>
                {trends.topAllergens[0].name} appeared in {Math.round((trends.topAllergens[0].count / totalMealsThisWeek) * 100)}% of meals
              </Text>
            </View>
          )}
        </View>
      </View>
      {/* Meals Per Day */}
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="restaurant" size={24} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>Meals Logged Per Day</Text>
        </View>
        <Text style={[styles.subtitle, { color: colors.icon }]}>Last 7 days</Text>
        
        <View style={styles.chartContainer}>
          {trends.dailyMeals.map((item, index) => (
            <View key={index} style={styles.barWrapper}>
              <Text style={[styles.barValue, { color: colors.text }]}>{item.count}</Text>
              <View 
                style={[
                  styles.bar, 
                  { 
                    height: (item.count / maxMeals) * 120,
                    backgroundColor: colors.primary 
                  }
                ]} 
              />
              <Text style={[styles.barLabel, { color: colors.icon }]}>{item.day}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Top Allergens */}
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="warning" size={24} color={colors.error} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>Top 3 Allergens This Week</Text>
        </View>
        <Text style={[styles.subtitle, { color: colors.icon }]}>Most detected in your meals</Text>
        
        <View style={styles.allergenList}>
          {trends.topAllergens.map((item, index) => (
            <View key={index} style={styles.allergenRow}>
              <View style={styles.allergenInfo}>
                <Text style={[styles.allergenName, { color: colors.text }]}>{item.name}</Text>
                <View style={styles.allergenBarContainer}>
                  <View 
                    style={[
                      styles.allergenBar, 
                      { 
                        width: `${(item.count / maxAllergens) * 100}%`,
                        backgroundColor: colors.error 
                      }
                    ]} 
                  />
                </View>
              </View>
              <Text style={[styles.allergenCount, { color: colors.error }]}>{item.count}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Reaction Trend */}
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="trending-down" size={24} color={colors.success} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>Reaction Trend</Text>
        </View>
        
        <View style={styles.reactionContainer}>
          <View style={styles.reactionRow}>
            <Text style={[styles.reactionLabel, { color: colors.icon }]}>This Week</Text>
            <Text style={[styles.reactionValue, { color: colors.text }]}>{trends.reactionsThisWeek}</Text>
          </View>
          <View style={styles.reactionRow}>
            <Text style={[styles.reactionLabel, { color: colors.icon }]}>Last Week</Text>
            <Text style={[styles.reactionValue, { color: colors.text }]}>{trends.reactionsLastWeek}</Text>
          </View>
          
          {reactionChange !== 0 && (
            <View style={[styles.changeCard, { backgroundColor: reactionChange > 0 ? '#E8F5E9' : '#FFEBEE' }]}>
              <Ionicons 
                name={reactionChange > 0 ? 'trending-down' : 'trending-up'} 
                size={20} 
                color={reactionChange > 0 ? '#4CAF50' : '#F44336'} 
              />
              <Text style={[styles.changeText, { color: reactionChange > 0 ? '#4CAF50' : '#F44336' }]}>
                {reactionChange > 0 ? 'Decreased' : 'Increased'} by {Math.abs(reactionChange)}% this week
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  chartContainer: {
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
    borderRadius: 4,
    marginVertical: 8,
  },
  barValue: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  barLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  allergenList: {
    marginTop: 12,
  },
  allergenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  allergenInfo: {
    flex: 1,
    marginRight: 12,
  },
  allergenName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  allergenBarContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  allergenBar: {
    height: '100%',
    borderRadius: 4,
  },
  allergenCount: {
    fontSize: 18,
    fontWeight: '700',
    minWidth: 30,
    textAlign: 'right',
  },
  reactionContainer: {
    marginTop: 12,
  },
  reactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  reactionLabel: {
    fontSize: 16,
  },
  reactionValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  changeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  changeText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  insightsList: {
    marginTop: 12,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  insightText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
});
