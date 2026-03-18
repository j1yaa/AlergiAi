import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  MealReminder,
  loadReminders,
  updateReminder,
  requestPermissions
} from '../utils/reminderService';
import { useLanguage } from '../hooks/useLanguage';
import { useTheme } from '../hooks/useTheme';

export default function ReminderSettings() {
  const { colors, colorScheme } = useTheme();
  const [reminders, setReminders] = useState<MealReminder[]>([]);
  const [showTimePicker, setShowTimePicker] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const granted = await requestPermissions();
    setPermissionGranted(granted);
    const saved = await loadReminders();
    setReminders(saved);
  };

  const getMealIcon = (type: string) => {
    switch(type) {
      case 'breakfast': return 'sunny-outline';
      case 'lunch': return 'sunny';
      case 'dinner': return 'moon';
      case 'snack': return 'nutrition';
      default: return 'restaurant';
    }
  };

  const handleToggle = async (reminder: MealReminder) => {
    console.log('Toggle clicked for:', reminder.mealType, 'current state:', reminder.enabled);

    const updated = {...reminder, enabled: !reminder.enabled};
    setReminders(prev => prev.map(r => r.id === reminder.id ? updated : r));
    if (!permissionGranted && updated.enabled) {
      const granted = await requestPermissions();
      setPermissionGranted(granted);
      if (!granted) {
        setReminders(prev => prev.map(r => r.id === reminder.id ? reminder : r));
        return;
      }
    }

    await updateReminder(updated);
    console.log('Toggle saved:', updated.mealType, 'new state:', updated.enabled);
  };

  const handleTimeChange = async (reminderId: string, time: Date) => {
    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');
    const timeString = `${hours}:${minutes}`;

    const reminder = reminders.find(r => r.id === reminderId);
    if (reminder) {
      const updated = { ...reminder, time: timeString };
      await updateReminder(updated);
      setReminders(prev => prev.map(r => r.id === reminderId ? updated : r));
    }
    setShowTimePicker(null);
  };

  const parseTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const formatTime12Hour = (timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Ionicons name="notifications" size={32} color="#2196F3" />
        <Text style={[styles.title, { color: colors.text }]}>{t('reminders.mealReminders')}</Text>
        <Text style={[styles.subtitle, { color: colors.icon }]}>
          {t('reminders.getNotified')}
        </Text>
      </View>

      {!permissionGranted && (
        <View style={styles.permissionBanner}>
          <Ionicons name="warning" size={20} color="#FF9800" />
          <Text style={styles.permissionText}>
            {t('reminders.enableNotifications')}
          </Text>
        </View>
      )}

      {reminders.map(reminder => (
        <View key={reminder.id} style={[styles.reminderCard, { backgroundColor: colors.surface }]}>
          <View style={styles.reminderHeader}>
            <View style={styles.reminderInfo}>
              <Ionicons name={getMealIcon(reminder.mealType)} size={28} color="#2196F3" style={styles.mealIcon} />
              <View>
                <Text style={[styles.mealType, { color: colors.text }]}>
                  {t('reminders.' + reminder.mealType)}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowTimePicker(reminder.id)}
                  style={styles.timeButton}
                >
                  <Ionicons name="time-outline" size={16} color={colors.icon} />
                  <Text style={[styles.timeText, { color: colors.icon }]}>{formatTime12Hour(reminder.time)}</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Switch
              value={reminder.enabled}
              onValueChange={() => handleToggle(reminder)}
              trackColor={{ false: '#ddd', true: '#81c784' }}
              thumbColor={reminder.enabled ? '#4caf50' : '#f4f3f4'}
            />
          </View>

          {showTimePicker === reminder.id && (
            <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.cardBorder }]}>
              {Platform.OS === 'ios' && (
                <TouchableOpacity onPress={() => setShowTimePicker(null)} style={styles.doneButton}>
                  <Text style={[styles.doneButtonText, { color: colors.secondary }]}>Done</Text>
                </TouchableOpacity>
              )}
              <DateTimePicker
                value={parseTime(reminder.time)}
                mode="time"
                is24Hour={false}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                themeVariant={colorScheme}
                style={styles.picker}
                onChange={(event, selectedTime) => {
                  if (Platform.OS === 'android') {
                    setShowTimePicker(null);
                    if (event.type === 'set' && selectedTime) {
                      handleTimeChange(reminder.id, selectedTime);
                    }
                  } else {
                    if (selectedTime) {
                      handleTimeChange(reminder.id, selectedTime);
                    } else {
                      setShowTimePicker(null);
                    }
                  }
                }}
              />
            </View>
          )}
        </View>
      ))}

      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={20} color="#2196F3" />
        <Text style={styles.infoText}>
          {t('reminders.infoText')}
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
    textAlign: 'center',
  },
  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  permissionText: {
    marginLeft: 10,
    color: '#e65100',
    fontSize: 14,
    flex: 1,
  },
  reminderCard: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reminderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mealIcon: {
    marginRight: 15,
  },
  mealType: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 14,
    marginLeft: 4,
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
