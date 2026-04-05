import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator, Switch,
  KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';
import { getEmergencyContact, saveEmergencyContact, EmergencyContact } from '../utils/emergencyContactService';
import { functions, auth } from '../config/firebase';
import { httpsCallable } from 'firebase/functions';

export default function EmergencyContactScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();

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
        Alert.alert(t('emergencyContact.missingInfo'), t('emergencyContact.missingInfoMessage'));
        return;
      }
    }
    setSaving(true);
    try {
      await saveEmergencyContact(contact);
      setOriginalContact(contact);

      // Send opt-in request if notifications just got enabled or contact info changed
      const wasEnabled = originalContact?.notifyEnabled;
      const contactChanged = originalContact?.phone !== contact.phone || originalContact?.email !== contact.email;
      if (contact.notifyEnabled && (!wasEnabled || contactChanged)) {
        const user = auth.currentUser;
        const sendOptInRequest = httpsCallable(functions, 'sendOptInRequest');
        await sendOptInRequest({
          contactPhone: contact.phone,
          contactEmail: contact.email,
          contactName: [contact.firstName, contact.lastName].filter(Boolean).join(' '),
          userName: user?.displayName || user?.email || 'A user',
        });
        Alert.alert(
          t('emergencyContact.saved'),
          'An opt-in request has been sent to your emergency contact.'
        );
      } else {
        Alert.alert(t('emergencyContact.saved'), t('emergencyContact.saveSuccess'));
      }
    } catch (e) {
      Alert.alert(t('common.error'), t('emergencyContact.saveError'));
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
          <Text style={[styles.title, { color: colors.text }]}>{t('emergencyContact.title')}</Text>
          <Text style={[styles.subtitle, { color: colors.icon }]}>
            {t('emergencyContact.subtitle')}
          </Text>
        </View>

        {/* Notify Toggle */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.row}>
            <View style={styles.labelContainer}>
              <Text style={[styles.label, { color: colors.text }]}>{t('emergencyContact.enableNotifications')}</Text>
              <Text style={[styles.description, { color: colors.icon }]}>
                {t('emergencyContact.enableDescription')}
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
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('emergencyContact.contactInfo')}</Text>

          <Text style={[styles.inputLabel, { color: colors.icon }]}>{t('emergencyContact.firstName')}</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.cardBorder, color: colors.text }]}
            value={contact.firstName}
            onChangeText={(v) => update({ firstName: v })}
            placeholder={t('emergencyContact.firstNamePlaceholder')}
            placeholderTextColor={colors.icon}
          />

          <Text style={[styles.inputLabel, { color: colors.icon }]}>{t('emergencyContact.lastName')}</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.cardBorder, color: colors.text }]}
            value={contact.lastName}
            onChangeText={(v) => update({ lastName: v })}
            placeholder={t('emergencyContact.lastNamePlaceholder')}
            placeholderTextColor={colors.icon}
          />

          <Text style={[styles.inputLabel, { color: colors.icon }]}>{t('emergencyContact.phoneNumber')}</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.cardBorder, color: colors.text }]}
            value={contact.phone}
            onChangeText={(v) => update({ phone: v })}
            placeholder={t('emergencyContact.phonePlaceholder')}
            placeholderTextColor={colors.icon}
            keyboardType="phone-pad"
          />

          <Text style={[styles.inputLabel, { color: colors.icon }]}>{t('emergencyContact.email')}</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.cardBorder, color: colors.text }]}
            value={contact.email}
            onChangeText={(v) => update({ email: v })}
            placeholder={t('emergencyContact.emailPlaceholder')}
            placeholderTextColor={colors.icon}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Info box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#2196F3" />
          <Text style={styles.infoText}>
            {t('emergencyContact.infoText')}
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
            <Text style={styles.saveButtonText}>{t('emergencyContact.save')}</Text>
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
