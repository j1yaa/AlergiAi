import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TextInput, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getAlertSettings, saveAlertSettings, AlertSettings } from '../utils/allergenAlertService';
import { useLanguage } from '../hooks/useLanguage';
import { useTheme } from '../hooks/useTheme';

export default function AlertSettingsScreen() {
  const { colors, colorScheme } = useTheme();
  const [settings, setSettings] = useState<AlertSettings>({
    enabled: true,
    quietHours: { start: '22:00', end: '07:00' },
    severityThreshold: 'low',
    notifyEmergencyContact: false,
  });
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const { t } = useLanguage();

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
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Ionicons name="notifications" size={32} color="#F44336" />
        <Text style={[styles.title, { color: colors.text }]}>{t('alertSettings.alertSettings')}</Text>
        <Text style={[styles.subtitle, { color: colors.icon }]}>{t('alertSettings.customizeNotifications')}</Text>
      </View>

      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <View style={styles.row}>
          <View style={styles.labelContainer}>
            <Text style={[styles.label, { color: colors.text }]}>{t('alertSettings.enableAlerts')}</Text>
            <Text style={[styles.description, { color: colors.icon }]}>{t('alertSettings.enableAlertsDescription')}</Text>
          </View>
          <Switch
            value={settings.enabled}
            onValueChange={(value) => updateSettings({ enabled: value })}
            trackColor={{ false: '#ddd', true: '#81c784' }}
            thumbColor={settings.enabled ? '#4caf50' : '#f4f3f4'}
          />
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('alertSettings.severityThreshold')}</Text>
        <Text style={[styles.description, { color: colors.icon }]}>{t('alertSettings.severityThresholdDescription')}</Text>

        <View style={styles.thresholdButtons}>
          {['minimal', 'low', 'moderate', 'high', 'severe'].map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.thresholdButton,
                styles[`${level}Button` as keyof typeof styles] as any,
                settings.severityThreshold === level && styles.thresholdButtonActive,
              ]}
              onPress={() => updateSettings({ severityThreshold: level as any })}
            >
              <Text style={[
                styles.thresholdText,
                settings.severityThreshold === level && styles.thresholdTextActive
              ]}>
                {t('alertSettings.' + level)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('alertSettings.quietHours')}</Text>
        <Text style={[styles.description, { color: colors.icon }]}>{t('alertSettings.quietHoursDescription')}</Text>

        <View style={styles.timeRow}>
          <View style={styles.timeItem}>
            <Text style={[styles.timeLabel, { color: colors.icon }]}>{t('alertSettings.start')}</Text>
            <TouchableOpacity
              style={[styles.timeButton, { backgroundColor: colors.background, borderColor: colors.cardBorder }]}
              onPress={() => setShowStartPicker(true)}
            >
              <Ionicons name="time-outline" size={20} color={colors.icon} />
              <Text style={[styles.timeText, { color: colors.text }]}>{settings.quietHours.start}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.timeItem}>
            <Text style={[styles.timeLabel, { color: colors.icon }]}>{t('alertSettings.end')}</Text>
            <TouchableOpacity
              style={[styles.timeButton, { backgroundColor: colors.background, borderColor: colors.cardBorder }]}
              onPress={() => setShowEndPicker(true)}
            >
              <Ionicons name="time-outline" size={20} color={colors.icon} />
              <Text style={[styles.timeText, { color: colors.text }]}>{settings.quietHours.end}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {showStartPicker && (
          <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.cardBorder }]}>
            <TouchableOpacity onPress={() => setShowStartPicker(false)} style={styles.doneButton}>
              <Text style={[styles.doneButtonText, { color: colors.secondary }]}>Done</Text>
            </TouchableOpacity>
            <DateTimePicker
              value={parseTime(settings.quietHours.start)}
              mode="time"
              is24Hour={false}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              themeVariant={colorScheme}
              style={styles.picker}
              onChange={(event, time) => {
                if (Platform.OS === 'android') {
                  setShowStartPicker(false);
                  if (event.type === 'set' && time) {
                    updateSettings({
                      quietHours: { ...settings.quietHours, start: formatTime(time) }
                    });
                  }
                } else if (time) {
                  updateSettings({
                    quietHours: { ...settings.quietHours, start: formatTime(time) }
                  });
                }
              }}
            />
          </View>
        )}

        {showEndPicker && (
          <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.cardBorder }]}>
            <TouchableOpacity onPress={() => setShowEndPicker(false)} style={styles.doneButton}>
              <Text style={[styles.doneButtonText, { color: colors.secondary }]}>Done</Text>
            </TouchableOpacity>
            <DateTimePicker
              value={parseTime(settings.quietHours.end)}
              mode="time"
              is24Hour={false}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              themeVariant={colorScheme}
              style={styles.picker}
              onChange={(event, time) => {
                if (Platform.OS === 'android') {
                  setShowEndPicker(false);
                  if (event.type === 'set' && time) {
                    updateSettings({
                      quietHours: { ...settings.quietHours, end: formatTime(time) }
                    });
                  }
                } else if (time) {
                  updateSettings({
                    quietHours: { ...settings.quietHours, end: formatTime(time) }
                  });
                }
              }}
            />
          </View>
        )}
      </View>

      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <View style={styles.row}>
          <View style={styles.labelContainer}>
            <Text style={[styles.label, { color: colors.text }]}>{t('alertSettings.emergencyContact')}</Text>
            <Text style={[styles.description, { color: colors.icon }]}>{t('alertSettings.emergencyContactDescription')}</Text>
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
            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.cardBorder, color: colors.text }]}
            placeholder={t('alertSettings.emergencyContactPhone')}
            placeholderTextColor={colors.icon}
            value={settings.emergencyContactPhone}
            onChangeText={(phone) => updateSettings({ emergencyContactPhone: phone })}
            keyboardType="phone-pad"
          />
        )}
      </View>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={20} color="#2196F3" />
        <Text style={styles.infoText}>
          {t('alertSettings.infoText')}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  subtitle: {
    fontSize: 14,
    marginTop: 5,
  },
  section: {
    marginBottom: 25,
    padding: 15,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
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
  },
  description: {
    fontSize: 13,
    marginTop: 4,
  },
  thresholdButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  thresholdButton: {
    width: '30%',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
  },
  thresholdButtonActive: {
    borderWidth: 3,
  },
  minimalButton: {
    backgroundColor: '#F1F8E9',
    borderColor: '#9CCC65',
  },
  lowButton: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4caf50',
  },
  moderateButton: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FFA726',
  },
  mediumButton: {
    backgroundColor: '#fff3e0',
    borderColor: '#ff9800',
  },
  highButton: {
    backgroundColor: '#FFEBEE',
    borderColor: '#EF5350',
  },
  severeButton: {
    backgroundColor: '#FCE4EC',
    borderColor: '#AD1457',
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
    marginBottom: 8,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  timeText: {
    fontSize: 16,
    marginLeft: 8,
  },
  input: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
    fontSize: 16,
  },
  pickerContainer: {
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
  },
  picker: {
    height: 216,
  },
  doneButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
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
