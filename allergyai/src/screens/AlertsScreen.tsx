import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert as RNAlert, ScrollView } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getAlerts } from '../api/client';
import { Alert } from '../types';
import { markAlertRead, acknowledgeAlert, clearAlerts } from '../utils/allergenAlertService';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';

export default function AlertsScreen() {
  const { colors } = useTheme();
  const { t, language } = useLanguage();
  const navigation = useNavigation();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'minimal' | 'low' | 'moderate' | 'high' | 'severe'>('all');

  useFocusEffect(
    React.useCallback(() => {
      loadAlerts();
    }, [])
  );

  const loadAlerts = async () => {
    try {
      const response = await getAlerts();
      const sorted = [...response.items].sort(
        (a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime()
      );
      setAlerts(sorted);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAlertMessage = (item: Alert) => {
    const severityLabel = item.severity.toUpperCase();
    const allergenList = item.allergens.length > 0 ? item.allergens.join(', ') : '';
    const sourceKey = item.source === 'scan' ? 'detectedInScan'
      : item.source === 'manual' ? 'detectedInManual'
      : 'detectedInMeal';
    if (allergenList) {
      return `${t('alerts.riskLabel', { severity: severityLabel, allergen: allergenList })} ${t(`alerts.${sourceKey}`)}`;
    }
    return item.message || '';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'severe': return '#880E4F';
      case 'high': return '#F44336';
      case 'moderate': return '#FF9800';
      case 'low': return '#4CAF50';
      case 'minimal': return '#8BC34A';
      default: return '#9E9E9E';
    }
  };

  const formatDate = (dateISO: string) => {
    return new Date(dateISO).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
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
      t('alerts.acknowledgeAlert'),
      t('alerts.whatActionDidYouTake'),
      [
        { text: t('alerts.avoidedAllergen'), onPress: () => acknowledgeAlertWithAction(alertId, 'avoided') },
        { text: t('alerts.noAction'), onPress: () => acknowledgeAlertWithAction(alertId, 'consumed') },
        { text: t('alerts.tookMedication'), onPress: () => acknowledgeAlertWithAction(alertId, 'medicated') },
        { text: t('common.cancel'), style: 'cancel' },
      ]
    );
  };

  const acknowledgeAlertWithAction = async (alertId: string, action: string) => {
    await acknowledgeAlert(alertId, action);
    loadAlerts();
  };

  const handleClearAlerts = () => {
    const isAll = filter === 'all';
    const label = isAll ? 'all alerts' : `all ${filter} alerts`;
    RNAlert.alert(
      'Clear Alerts',
      `Are you sure you want to delete ${label}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAlerts(isAll ? undefined : filter);
              loadAlerts();
            } catch (e) {
              RNAlert.alert('Error', 'Could not clear alerts. Please try again.');
            }
          },
        },
      ]
    );
  };

  const filteredAlerts = filter === 'all'
    ? alerts
    : alerts.filter(a => a.severity === filter);

  const unreadCount = alerts.filter(a => !a.read).length;

  const renderAlert = ({ item }: { item: Alert }) => (
    <View style={[styles.alertCard, { backgroundColor: colors.surface, borderLeftColor: getSeverityColor(item.severity) }, !item.read && { borderTopWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderTopColor: colors.primary, borderRightColor: colors.primary, borderBottomColor: colors.primary }]}>
      <View style={styles.alertHeader}>
        <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(item.severity) + '20' }]}>
          <Ionicons name="warning" size={14} color={getSeverityColor(item.severity)} />
          <Text style={[styles.severityLabel, { color: getSeverityColor(item.severity) }]}>
            {item.severity.charAt(0).toUpperCase() + item.severity.slice(1)}
          </Text>
        </View>
        <Text style={[styles.date, { color: colors.icon }]}>{formatDate(item.dateISO)}</Text>
        {!item.read && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
      </View>
      <Text style={[styles.message, { color: colors.text }]}>{getAlertMessage(item)}</Text>
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
            style={[styles.actionButton, { backgroundColor: colors.background, borderColor: colors.icon + '40' }]}
            onPress={() => handleMarkRead(item.id)}
          >
            <Ionicons name="checkmark" size={16} color="#4CAF50" />
            <Text style={[styles.actionText, { color: colors.text }]}>{t('alerts.markRead')}</Text>
          </TouchableOpacity>
        )}
        {!item.acknowledged && (
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.background, borderColor: colors.icon + '40' }]}
            onPress={() => handleAcknowledge(item.id)}
          >
            <Ionicons name="hand-left" size={16} color="#2196F3" />
            <Text style={[styles.actionText, { color: colors.text }]}>{t('alerts.acknowledge')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>{t('alerts.loadingAlerts')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>{t('alerts.alerts')}</Text>
          {unreadCount > 0 && (
            <Text style={[styles.unreadCount, { color: colors.error }]}>{t('alerts.unreadCount', { count: unreadCount })}</Text>
          )}
        </View>
        {alerts.length > 0 && (
          <TouchableOpacity
            style={[styles.clearButton, { borderColor: colors.error + '60' }]}
            onPress={handleClearAlerts}
          >
            <Ionicons name="trash-outline" size={15} color={colors.error} />
            <Text style={[styles.clearButtonText, { color: colors.error }]}>
              {filter === 'all' ? 'Clear All' : `Clear ${filter.charAt(0).toUpperCase() + filter.slice(1)}`}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterRowContent}>
        {(['all', 'minimal', 'low', 'moderate', 'high', 'severe'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterButton,
              { backgroundColor: colors.surface, borderColor: colors.icon + '40' },
              filter === f && { backgroundColor: colors.primary, borderColor: colors.primary }
            ]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, { color: colors.icon }, filter === f && styles.filterTextActive]}>
              {t(`alerts.filter${f.charAt(0).toUpperCase() + f.slice(1)}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {filteredAlerts.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="notifications-off-outline" size={64} color={colors.icon} />
          <Text style={[styles.emptyText, { color: colors.icon }]}>{t('alerts.noAlerts')}</Text>
          <Text style={[styles.emptySubtext, { color: colors.icon }]}>{t('alerts.emptyState')}</Text>
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
    backgroundColor: '#fff',
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
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  clearButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  settingsButton: {
    padding: 8,
  },
  filterRow: {
    flexGrow: 0,
    flexShrink: 0,
    marginBottom: 15,
  },
  filterRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
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
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginRight: 10,
    gap: 4,
  },
  severityLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  date: {
    fontSize: 13,
    fontWeight: '500',
  },
  message: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
    marginBottom: 10,
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