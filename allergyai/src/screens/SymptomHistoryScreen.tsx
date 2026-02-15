import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getSymptoms, getMeals } from '../api/client';
import { Symptom, Meal } from '../types';
import SymptomCorrelationChart from '../components/SymptomCorrelationChart';

// Placeholder function for deleting symptoms
const deleteSymptom = async (id: string) => {
  console.log('Deleting symptom:', id);
  // This would normally delete from the backend
  return true;
};

export default function SymptomHistoryScreen() {
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [correlationData, setCorrelationData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useFocusEffect(
    React.useCallback(() => {
      loadSymptoms();
    }, [])
  );

  const loadSymptoms = async () => {
    try {
      console.log('Loading symptoms...');
      const response = await getSymptoms();
      console.log('Loaded symptoms:', response.items);
      setSymptoms(response.items);

      const meals = await getMeals();
      const correlations = calculateCorrelations(response.items, meals);
      setCorrelationData(correlations);
    } catch (error) {
      console.error('Failed to load symptoms:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateCorrelations = (symptoms: Symptom[], meals: Meal[]) => {
    const allergenMap = new Map<string, { count: number; totalSeverity: number }>();

    symptoms.forEach(symptom => {
      const symptomDate = new Date(symptom.dateISO);
      const recentMeals = meals.filter(meal => {
        const mealDate = meal.timeStamp ? new Date(meal.timeStamp) : meal.createdAt ? new Date(meal.createdAt) : null;
        if (!mealDate) return false;
        const hoursDiff = (symptomDate.getTime() - mealDate.getTime()) / (1000 * 60 * 60);
        return hoursDiff >= 0 && hoursDiff <= 24;
      });

      recentMeals.forEach(meal => {
        const foodItems = meal.allergens || meal.ingredients || meal.items || [];
          foodItems.forEach(item => {
            if (!item || typeof item !== 'string') return;
            const current = allergenMap.get(item) || { count: 0, totalSeverity: 0 };
            allergenMap.set(item, {
              count: current.count + 1,
              totalSeverity: current.totalSeverity + symptom.severity
            });
          });
      });
  });

  return Array.from(allergenMap.entries())
    .map(([allergen, data]) => ({
      allergen,
      count: data.count,
      avgSeverity: data.totalSeverity / data.count
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  };

  const handleDeleteSymptom = (symptom: Symptom) => {
    Alert.alert(
      'Delete Symptom',
      `Are you sure you want to delete this symptom?\n\n"${symptom.description}"`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSymptom(symptom.id);
              setSymptoms((prev: Symptom[]) => prev.filter((s: Symptom) => s.id !== symptom.id));
              Alert.alert('Success', 'Symptom deleted successfully');
            } catch (error) {
              console.error('Failed to delete symptom:', error);
              Alert.alert('Error', 'Failed to delete symptom. Please try again.');
            }
          }
        }
      ]
    );
  };

  const getSeverityColor = (severity: number) => {
    if (severity <= 2) return '#4CAF50';
    if (severity <= 3) return '#FF9800';
    return '#F44336';
  };

  const getSeverityLabel = (severity: number) => {
    if (severity <= 2) return 'Mild';
    if (severity <= 3) return 'Moderate';
    return 'Severe';
  };

  const formatDate = (dateISO: string) => {
    return new Date(dateISO).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderSymptom = ({ item }: { item: Symptom }) => (
    <View style={styles.symptomCard}>
      <View style={styles.symptomHeader}>
        <Text style={styles.date}>{formatDate(item.dateISO)}</Text>
        <View style={styles.headerRight}>
          <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(item.severity) }]}>
            <Text style={styles.severityText}>{getSeverityLabel(item.severity)}</Text>
          </View>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => handleDeleteSymptom(item)}
          >
            <Text style={styles.deleteButtonText}>×</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading symptoms...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Symptom History</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('AddSymptom' as never)}
        >
          <Text style={styles.addButtonText}>+ Log Symptom</Text>
        </TouchableOpacity>
      </View>
      
      {symptoms.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No symptoms logged yet</Text>
        </View>
      ) : (
         <ScrollView showsVerticalScrollIndicator={false}>
           <SymptomCorrelationChart data={correlationData} />
             {symptoms.map((item: Symptom) => (
                 <View key={item.id}>{renderSymptom({ item })}</View>
             ))}
        </ScrollView>
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
  },
  addButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  symptomCard: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  symptomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 16,
    lineHeight: 22,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  deleteButton: {
    backgroundColor: '#F44336',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 20,
  },
});