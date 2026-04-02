import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator, Switch,
  KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { getEmergencyContact, saveEmergencyContact, EmergencyContact } from '../utils/emergencyContactService';

export default function EmergencyContactScreen() {
  const { colors } = useTheme();

  const [contact, setContact] = useState<EmergencyContact>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    notifyEnabled: false,
  });
  const [originalContact, setOriginalContact] = useState<EmergencyContact | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadContact();
  }, []);

  const loadContact = async () => {
    const saved = await getEmergencyContact();
    setContact(saved);
    setOriginalContact(saved);
    setLoading(false);
  };

  const update = (fields: Partial<EmergencyContact>) => {
    setContact(prev => ({ ...prev, ...fields }));
  };

  const hasChanges = originalContact !== null &&
    JSON.stringify(contact) !== JSON.stringify(originalContact);

  const handleSave = async () => {
    if (contact.notifyEnabled) {
      if (!contact.phone && !contact.email) {
        Alert.alert('Missing Info', 'Please enter a phone number or email to enable notifications.');
        return;
      }
    }
    setSaving(true);
    try {
      await saveEmergencyContact(contact);
      setOriginalContact(contact);
      Alert.alert('Saved', 'Emergency contact has been updated.');
    } catch (e) {
      Alert.alert('Error', 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>

        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="call" size={32} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>Emergency Contact</Text>
          <Text style={[styles.subtitle, { color: colors.icon }]}>
            This person will be notified if a high-severity allergen is detected
          </Text>
        </View>

        {/* Notify Toggle */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.row}>
            <View style={styles.labelContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Enable Notifications</Text>
              <Text style={[styles.description, { color: colors.icon }]}>
                Send a text & email to your emergency contact when a high-severity allergen is logged
              </Text>
            </View>
            <Switch
              value={contact.notifyEnabled}
              onValueChange={(value) => update({ notifyEnabled: value })}
              trackColor={{ false: '#ddd', true: '#81c784' }}
              thumbColor={contact.notifyEnabled ? '#4caf50' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Contact Info */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact Information</Text>

          <Text style={[styles.inputLabel, { color: colors.icon }]}>First Name</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.cardBorder, color: colors.text }]}
            value={contact.firstName}
            onChangeText={(v) => update({ firstName: v })}
            placeholder="First name"
            placeholderTextColor={colors.icon}
          />

          <Text style={[styles.inputLabel, { color: colors.icon }]}>Last Name</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.cardBorder, color: colors.text }]}
            value={contact.lastName}
            onChangeText={(v) => update({ lastName: v })}
            placeholder="Last name"
            placeholderTextColor={colors.icon}
          />

          <Text style={[styles.inputLabel, { color: colors.icon }]}>Phone Number</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.cardBorder, color: colors.text }]}
            value={contact.phone}
            onChangeText={(v) => update({ phone: v })}
            placeholder="Phone number"
            placeholderTextColor={colors.icon}
            keyboardType="phone-pad"
          />

          <Text style={[styles.inputLabel, { color: colors.icon }]}>Email</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.cardBorder, color: colors.text }]}
            value={contact.email}
            onChangeText={(v) => update({ email: v })}
            placeholder="Email address"
            placeholderTextColor={colors.icon}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Info box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#2196F3" />
          <Text style={styles.infoText}>
            When a high-severity allergen alert is triggered, your emergency contact will receive a text message and email with your name and the allergen detected.
          </Text>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }, !hasChanges && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={!hasChanges || saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>SAVE</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
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
    lineHeight: 18,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 6,
  },
  input: {
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    fontSize: 16,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    marginLeft: 10,
    color: '#1565c0',
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 40,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
