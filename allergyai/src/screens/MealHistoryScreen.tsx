import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { MEALS_KEY, MealEntry } from '../utils/mealStorage';

export default function MealHistoryScreen() {
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  const loadMeals = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(MEALS_KEY);
      setMeals(raw ? JSON.parse(raw) : []);
    } catch (error) {
      console.error('Failed to load meals:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    loadMeals();
  }, [loadMeals]));

  const formatDate = (dateISO: string) => {
    return new Date(dateISO).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const deleteMeal = async (id: string) => {
    Alert.alert(
      'Delete Meal',
      'Are you sure you want to delete this meal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const storedMeals = await AsyncStorage.getItem(MEALS_KEY);
              const mealList = storedMeals ? JSON.parse(storedMeals) : [];
              const updatedMeals = mealList.filter((meal: MealEntry) => meal.id !== id);
              await AsyncStorage.setItem(MEALS_KEY, JSON.stringify(updatedMeals));
              setMeals(updatedMeals);
            } catch (error) {
              console.error('Failed to delete meal:', error);
              Alert.alert('Error', 'Failed to delete meal');
            }
          }
        }
      ]
    );
  };

  const renderMeal = ({ item }: { item: MealEntry }) => (
    <View style={styles.mealCard}>
      <View style={styles.mealHeader}>
        <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
        <View style={styles.mealActions}>
          <View style={[styles.statusBadge, { backgroundColor: (item.riskScore || 0) < 50 ? '#4CAF50' : '#E53935' }]}>
            <Text style={styles.statusText}>{(item.riskScore || 0) < 50 ? 'Safe' : 'Risk'}</Text>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deleteMeal(item.id)}
            accessibilityLabel="Delete meal"
          >
            <Ionicons name="trash-outline" size={18} color="#E53935" />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.mealName}>{item.name}</Text>
      <Text style={styles.ingredients} numberOfLines={1}>{item.ingredients.join(', ')}</Text>
      {item.note && <Text style={styles.note}>{item.note}</Text>}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading meals...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Meal History</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('AddMeal' as never)}
        >
          <Text style={styles.addButtonText}>+ Log Meal</Text>
        </TouchableOpacity>
      </View>
      
      {meals.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="restaurant-outline" size={64} color="#7E7E7E" style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>No meals logged yet</Text>
          <Text style={styles.emptySubtitle}>Start tracking your meals to monitor allergen exposure</Text>
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={() => navigation.navigate('AddMeal' as never)}
          >
            <Text style={styles.emptyButtonText}>Log Your First Meal</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={meals}
          renderItem={renderMeal}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
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
    color: '#000',
  },
  addButton: {
    backgroundColor: '#1E88E5',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  mealCard: {
    backgroundColor: '#F5F5F7',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontSize: 14,
    color: '#7E7E7E',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  mealName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  ingredients: {
    fontSize: 14,
    color: '#7E7E7E',
  },
  note: {
    fontSize: 12,
    color: '#7E7E7E',
    fontStyle: 'italic',
    marginTop: 4,
  },
  deleteButton: {
    marginLeft: 8,
    padding: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#7E7E7E',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#1E88E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});