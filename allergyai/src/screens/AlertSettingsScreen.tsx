import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getAlertSettings, saveAlertSettings, AlertSettings } from '../utils/allergenAlertService';

export default function AlertSettingsScreen() {
  const [settings, setSettings] = useState<AlertSettings>({
    enabled: true,
    quietHours: { start: '22:00', end: '07:00' },
    severityThreshold: 'low',
    notifyEmergencyContact: false,
  });
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const saved = await getAlertSettings();
    setSettings(saved);
  };

  const updateSettings = async (updates: Partial<AlertSettings>) => {
    const updated = { ...settings, ...updates };
    setSettings(updated);
    await saveAlertSettings(updated);
  };

  const parseTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const formatTime = (date: Date) => {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="notifications" size={32} color="#F44336" />
        <Text style={styles.title}>Alert Settings</Text>
        <Text style={styles.subtitle}>Customize your allergen notifications</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.row}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>Enable Alerts</Text>
            <Text style={styles.description}>Receive notifications for allergen detection</Text>
          </View>
          <Switch
            value={settings.enabled}
            onValueChange={(value) => updateSettings({ enabled: value })}
            trackColor={{ false: '#ddd', true: '#81c784' }}
            thumbColor={settings.enabled ? '#4caf50' : '#f4f3f4'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Severity Threshold</Text>
        <Text style={styles.description}>Only notify for alerts at or above this level</Text>
        
        <View style={styles.thresholdButtons}>
          {['low', 'medium', 'high'].map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.thresholdButton,
                settings.severityThreshold === level && styles.thresholdButtonActive,
                level === 'low' && styles.lowButton,
                level === 'medium' && styles.mediumButton,
                level === 'high' && styles.highButton,
              ]}
              onPress={() => updateSettings({ severityThreshold: level as any })}
            >
              <Text style={[
                styles.thresholdText,
                settings.severityThreshold === level && styles.thresholdTextActive
              ]}>
                {level.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quiet Hours</Text>
        <Text style={styles.description}>No alerts during these hours</Text>
        
        <View style={styles.timeRow}>
          <View style={styles.timeItem}>
            <Text style={styles.timeLabel}>Start</Text>
            <TouchableOpacity 
              style={styles.timeButton}
              onPress={() => setShowStartPicker(true)}
            >
              <Ionicons name="time-outline" size={20} color="#666" />
              <Text style={styles.timeText}>{settings.quietHours.start}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.timeItem}>
            <Text style={styles.timeLabel}>End</Text>
            <TouchableOpacity 
              style={styles.timeButton}
              onPress={() => setShowEndPicker(true)}
            >
              <Ionicons name="time-outline" size={20} color="#666" />
              <Text style={styles.timeText}>{settings.quietHours.end}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {showStartPicker && (
          <DateTimePicker
            value={parseTime(settings.quietHours.start)}
            mode="time"
            is24Hour={false}
            onChange={(event, time) => {
              setShowStartPicker(false);
              if (time) {
                updateSettings({
                  quietHours: { ...settings.quietHours, start: formatTime(time) }
                });
              }
            }}
          />
        )}

        {showEndPicker && (
          <DateTimePicker
            value={parseTime(settings.quietHours.end)}
            mode="time"
            is24Hour={false}
            onChange={(event, time) => {
              setShowEndPicker(false);
              if (time) {
                updateSettings({
                  quietHours: { ...settings.quietHours, end: formatTime(time) }
                });
              }
            }}
          />
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.row}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>Emergency Contact</Text>
            <Text style={styles.description}>Notify contact for high-risk alerts</Text>
          </View>
          <Switch
            value={settings.notifyEmergencyContact}
            onValueChange={(value) => updateSettings({ notifyEmergencyContact: value })}
            trackColor={{ false: '#ddd', true: '#ffb74d' }}
            thumbColor={settings.notifyEmergencyContact ? '#ff9800' : '#f4f3f4'}
          />
        </View>

        {settings.notifyEmergencyContact && (
          <TextInput
            style={styles.input}
            placeholder="Emergency contact phone"
            value={settings.emergencyContactPhone}
            onChangeText={(phone) => updateSettings({ emergencyContactPhone: phone })}
            keyboardType="phone-pad"
          />
        )}
      </View>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={20} color="#2196F3" />
        <Text style={styles.infoText}>
          Alerts help you avoid allergen exposure and track patterns over time
        </Text>
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
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  section: {
    marginBottom: 25,
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelContainer: {
    flex: 1,
    marginRight: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  description: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  thresholdButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  thresholdButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
  },
  thresholdButtonActive: {
    borderWidth: 2,
  },
  lowButton: {
    backgroundColor: '#e8f5e9',
  },
  mediumButton: {
    backgroundColor: '#fff3e0',
  },
  highButton: {
    backgroundColor: '#ffebee',
  },
  thresholdText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  thresholdTextActive: {
    color: '#333',
  },
  timeRow: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 10,
  },
  timeItem: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  timeText: {
    fontSize: 16,
    marginLeft: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginTop: 10,
    fontSize: 16,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  infoText: {
    marginLeft: 10,
    color: '#1565c0',
    fontSize: 13,
    flex: 1,
  },
});
