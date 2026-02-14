import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert as RNAlert } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getAlerts } from '../api/client';
import { Alert } from '../types';
import { markAlertRead, acknowledgeAlert, checkExposurePattern } from '../utils/allergenAlertService';
import { useTheme } from '../hooks/useTheme';

export default function AlertsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  useFocusEffect(
    React.useCallback(() => {
      loadAlerts();
    }, [])
  );

  const loadAlerts = async () => {
    try {
      const response = await getAlerts();
      setAlerts(response.items);
      
      // Check for exposure patterns
      const uniqueAllergens = [...new Set(response.items.map(a => a.allergens).flat())];
      for (const allergen of uniqueAllergens) {
        const pattern = await checkExposurePattern(allergen);
        if (pattern) console.log(pattern);
      }
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return '#F44336';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  const formatDate = (dateISO: string) => {
    return new Date(dateISO).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleMarkRead = async (alertId: string) => {
    await markAlertRead(alertId);
    loadAlerts();
  };

  const handleAcknowledge = (alertId: string) => {
    RNAlert.alert(
      'Acknowledge Alert',
      'What action did you take?',
      [
        { text: 'Avoided food', onPress: () => acknowledgeAlertWithAction(alertId, 'avoided') },
        { text: 'Ate anyway', onPress: () => acknowledgeAlertWithAction(alertId, 'consumed') },
        { text: 'Took medication', onPress: () => acknowledgeAlertWithAction(alertId, 'medicated') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const acknowledgeAlertWithAction = async (alertId: string, action: string) => {
    await acknowledgeAlert(alertId, action);
    loadAlerts();
  };

  const filteredAlerts = filter === 'all' 
    ? alerts 
    : alerts.filter(a => a.severity === filter);

  const unreadCount = alerts.filter(a => !a.read).length;

  const renderAlert = ({ item }: { item: Alert }) => (
    <View style={[styles.alertCard, !item.read && styles.unreadCard]}>
      <View style={styles.alertHeader}>
        <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(item.severity) }]}>
          <Ionicons name="warning" size={16} color="#fff" />
        </View>
        <Text style={styles.date}>{formatDate(item.dateISO)}</Text>
        {!item.read && <View style={styles.unreadDot} />}
      </View>
      <Text style={styles.message}>{item.message}</Text>
      {item.allergens.length > 0 && (
        <View style={styles.allergenContainer}>
          {item.allergens.map((allergen, index) => (
            <View key={index} style={styles.allergenPill}>
              <Text style={styles.allergenText}>{allergen}</Text>
            </View>
          ))}
        </View>
      )}
      
      <View style={styles.actions}>
        {!item.read && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleMarkRead(item.id)}
          >
            <Ionicons name="checkmark" size={16} color="#4CAF50" />
            <Text style={styles.actionText}>Mark Read</Text>
          </TouchableOpacity>
        )}
        {!item.acknowledged && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleAcknowledge(item.id)}
          >
            <Ionicons name="hand-left" size={16} color="#2196F3" />
            <Text style={styles.actionText}>Acknowledge</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading alerts...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Alerts</Text>
          {unreadCount > 0 && (
            <Text style={styles.unreadCount}>{unreadCount} unread</Text>
          )}
        </View>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => navigation.navigate('AlertSettings' as never)}
        >
          <Ionicons name="settings-outline" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        {['all', 'high', 'medium', 'low'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterButton, filter === f && styles.filterButtonActive]}
            onPress={() => setFilter(f as any)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {filteredAlerts.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="notifications-off-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No alerts yet</Text>
          <Text style={styles.emptySubtext}>Alerts will appear here when allergens are detected</Text>
        </View>
      ) : (
        <FlatList
          data={filteredAlerts}
          renderItem={renderAlert}
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
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  unreadCount: {
    fontSize: 14,
    color: '#F44336',
    marginTop: 4,
  },
  settingsButton: {
    padding: 8,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 15,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  filterTextActive: {
    color: '#fff',
  },
  alertCard: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  unreadCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2196F3',
    marginLeft: 'auto',
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 10,
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  message: {
    fontSize: 16,
    lineHeight: 22,
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
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  actionText: {
    fontSize: 12,
    marginLeft: 4,
    color: '#666',
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
});