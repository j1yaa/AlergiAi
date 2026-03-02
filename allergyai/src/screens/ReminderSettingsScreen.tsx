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

export default function ReminderSettings() {
  const [reminders, setReminders] = useState<MealReminder[]>([]);
  const [showTimePicker, setShowTimePicker] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

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
    if (!permissionGranted) {
      const granted = await requestPermissions();
      if (!granted) return;
      setPermissionGranted(true);
    }

    const updated = { ...reminder, enabled: !reminder.enabled };
    await updateReminder(updated);
    setReminders(prev => prev.map(r => r.id === reminder.id ? updated : r));
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="notifications" size={32} color="#2196F3" />
        <Text style={styles.title}>Meal Reminders</Text>
        <Text style={styles.subtitle}>
          Get notified when it's time to log your meals
        </Text>
      </View>

      {!permissionGranted && (
        <View style={styles.permissionBanner}>
          <Ionicons name="warning" size={20} color="#FF9800" />
          <Text style={styles.permissionText}>
            Enable notifications to receive reminders
          </Text>
        </View>
      )}

      {reminders.map(reminder => (
        <View key={reminder.id} style={styles.reminderCard}>
          <View style={styles.reminderHeader}>
            <View style={styles.reminderInfo}>
              <Ionicons name={getMealIcon(reminder.mealType)} size={28} color="#2196F3" style={styles.mealIcon} />
              <View>
                <Text style={styles.mealType}>
                  {reminder.mealType.charAt(0).toUpperCase() + reminder.mealType.slice(1)}
                </Text>
                <TouchableOpacity 
                  onPress={() => setShowTimePicker(reminder.id)}
                  style={styles.timeButton}
                >
                  <Ionicons name="time-outline" size={16} color="#666" />
                  <Text style={styles.timeText}>{reminder.time}</Text>
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
            <DateTimePicker
              value={parseTime(reminder.time)}
              mode="time"
              is24Hour={false}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedTime) => {
                if (selectedTime) {
                  handleTimeChange(reminder.id, selectedTime);
                } else {
                  setShowTimePicker(null);
                }
              }}
            />
          )}
        </View>
      ))}

      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={20} color="#2196F3" />
        <Text style={styles.infoText}>
          Reminders help you stay consistent with meal logging and allergen tracking
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
    backgroundColor: '#f5f5f5',
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
    color: '#333',
    marginBottom: 4,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
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
