import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getSymptoms } from '../api/client';
import { Symptom } from '../types';

export default function SymptomHistoryScreen() {
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useFocusEffect(
    React.useCallback(() => {
      loadSymptoms();
    }, [])
  );

  const loadSymptoms = async () => {
    try {
      const response = await getSymptoms();
      setSymptoms(response.items);
    } catch (error) {
      console.qerror('Failed to load symptoms:', error);
    } finally {
      setLoading(false);
    }
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
    <TouchableOpacity style={styles.symptomCard}>
      <View style={styles.symptomHeader}>
        <Text style={styles.date}>{formatDate(item.dateISO)}</Text>
        <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(item.severity) }]}>
          <Text style={styles.severityText}>{getSeverityLabel(item.severity)}</Text>
        </View>
      </View>
      <ThemedText style={styles.description}>{item.description}</ThemedText>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ThemedText>Loading symptoms...</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Symptom History</ThemedText>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('AddSymptom' as never)}
        >
          <Text style={styles.addButtonText}>+ Log Symptom</Text>
        </TouchableOpacity>
      </View>
      
      {symptoms.length === 0 ? (
        <View style={styles.emptyState}>
          <ThemedText style={styles.emptyText}>No symptoms logged yet</ThemedText>
        </View>
      ) : (
        <FlatList
          data={symptoms}
          renderItem={renderSymptom}
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
});