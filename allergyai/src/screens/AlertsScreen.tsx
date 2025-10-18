import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { getAlerts } from '../api/client';
import { Alert } from '../types';

export default function AlertsScreen({ navigation }: any) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<'all' | 'flagged'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, [filter]);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const response = await getAlerts({ status: filter });
      setAlerts(response.items);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return '#FF6B6B';
      case 'medium': return '#FFA726';
      case 'low': return '#66BB6A';
      default: return '#999';
    }
  };

  const renderAlert = ({ item }: { item: Alert }) => (
    <TouchableOpacity 
      style={styles.alertItem}
      onPress={() => navigation.navigate('AlertDetail', { alert: item })}
    >
      <View style={styles.alertHeader}>
        <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(item.severity) }]}>
          <Text style={styles.severityText}>{item.severity.toUpperCase()}</Text>
        </View>
        <Text style={styles.alertDate}>
          {new Date(item.dateISO).toLocaleDateString()}
        </Text>
      </View>
      <Text style={styles.alertNote}>{item.note}</Text>
      {item.allergens.length > 0 && (
        <View style={styles.allergenContainer}>
          {item.allergens.map((allergen, index) => (
            <View key={index} style={styles.allergenPill}>
              <Text style={styles.allergenText}>{allergen}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Alerts</Text>
      
      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[styles.filterButton, filter === 'all' && styles.activeFilter]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, filter === 'flagged' && styles.activeFilter]}
          onPress={() => setFilter('flagged')}
        >
          <Text style={[styles.filterText, filter === 'flagged' && styles.activeFilterText]}>
            Flagged
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={alerts}
        renderItem={renderAlert}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={loadAlerts}
        showsVerticalScrollIndicator={false}
      />
    </View>
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
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 10,
  },
  activeFilter: {
    backgroundColor: '#2196F3',
  },
  filterText: {
    color: '#666',
    fontWeight: 'bold',
  },
  activeFilterText: {
    color: '#fff',
  },
  alertItem: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  alertDate: {
    color: '#666',
    fontSize: 12,
  },
  alertNote: {
    fontSize: 14,
    marginBottom: 8,
  },
  allergenContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  allergenPill: {
    backgroundColor: '#ffebee',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  allergenText: {
    color: '#d32f2f',
    fontSize: 12,
  },
});