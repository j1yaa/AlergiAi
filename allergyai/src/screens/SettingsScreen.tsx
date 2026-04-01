import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { getProfile, getUserSettings, updateUserSettings } from '../api/client';
import { auth } from '../config/firebase';
import {
  updateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAlertSettings, saveAlertSettings } from '../utils/allergenAlertService';
import { useLanguage } from '../hooks/useLanguage';

export default function SettingsScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [medicalNotes, setMedicalNotes] = useState('');
  const [originalName, setOriginalName] = useState('');
  const [originalEmail, setOriginalEmail] = useState('');
  const [originalPhone, setOriginalPhone] = useState('');
  const [originalMedicalNotes, setOriginalMedicalNotes] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [profile, alertSettings] = await Promise.all([
        getProfile(),
        getAlertSettings()
      ]);
      setName(profile.name);
      setEmail(profile.email);
      setOriginalName(profile.name);
      setOriginalEmail(profile.email);
      setPhone(alertSettings.emergencyContactPhone || '');
      setOriginalPhone(alertSettings.emergencyContactPhone || '');
      setMedicalNotes(profile.medicalNotes || '');
      setOriginalMedicalNotes(profile.medicalNotes || '');
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      // Update name in Firestore
      if (name !== originalName) {
        const settings = await getUserSettings();
        await updateUserSettings({ ...settings, name });
      }

      // Update email in Firebase Auth + Firestore
      if (email !== originalEmail) {
        const password = await promptForPassword();
        if (!password) {
          setSaving(false);
          return;
        }
        const credential = EmailAuthProvider.credential(user.email!, password);
        await reauthenticateWithCredential(user, credential);
        await updateEmail(user, email);
        const settings = await getUserSettings();
        await updateUserSettings({ ...settings, email });
        await AsyncStorage.setItem('saved_email', email);
      }

      // Update emergency contact phone
      if (phone !== originalPhone) {
        const alertSettings = await getAlertSettings();
        await saveAlertSettings({ ...alertSettings, emergencyContactPhone: phone });
      }

      if (medicalNotes !== originalMedicalNotes) {
        const settings = await getUserSettings();
        await updateUserSettings({...settings, medicalNotes});
      }

      setOriginalName(name);
      setOriginalEmail(email);
      setOriginalPhone(phone);
      setOriginalMedicalNotes(medicalNotes);
      Alert.alert(t('common.success'), t('userProfile.profileUpdated'));
    } catch (error: any) {
      if (error.code === 'auth/wrong-password') {
        Alert.alert(t('common.error'), t('userProfile.incorrectPassword'));
      } else {
        Alert.alert(t('common.error'), error.message || t('userProfile.failedToUpdate'));
      }
    } finally {
      setSaving(false);
    }
  };

  const promptForPassword = (): Promise<string | null> => {
    return new Promise((resolve) => {
      Alert.prompt(
        t('userProfile.confirmPassword'),
        t('userProfile.enterPasswordToUpdate'),
        [
          { text: t('common.cancel'), style: 'cancel', onPress: () => resolve(null) },
          { text: t('common.confirm'), onPress: (password?: string) => resolve(password || null) }
        ],
        'secure-text'
      );
    });
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.icon }]}>{t('common.loading')}</Text>
      </View>
    );
  }

  const hasChanges = name !== originalName || email !== originalEmail || phone !== originalPhone || medicalNotes !== originalMedicalNotes;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Form */}
        <View style={styles.formSection}>
          <Text style={[styles.inputLabel, { color: colors.icon }]}>{t('userProfile.name')}</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.cardBorder, color: colors.text }]}
            value={name}
            onChangeText={setName}
            placeholder={t('userProfile.yourName')}
            placeholderTextColor={colors.icon}
          />

          <Text style={[styles.inputLabel, { color: colors.icon }]}>{t('userProfile.email')}</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.cardBorder, color: colors.text }]}
            value={email}
            onChangeText={setEmail}
            placeholder={t('userProfile.yourEmail')}
            placeholderTextColor={colors.icon}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={[styles.inputLabel, { color: colors.icon }]}>{t('userProfile.mobile')}</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.cardBorder, color: colors.text }]}
            value={phone}
            onChangeText={setPhone}
            placeholder={t('userProfile.emergencyContactPhone')}
            placeholderTextColor={colors.icon}
            keyboardType="phone-pad"
          />

          <Text style={[styles.inputLabel, { color: colors.icon }]}>{t('userProfile.medicalNotes')}</Text>
          <TextInput
            style={[styles.textArea, { borderColor: colors.cardBorder, color: colors.text, backgroundColor: colors.surface }]}
            value={medicalNotes}
            onChangeText={setMedicalNotes}
            placeholder={t('userProfile.medicalNotesPlaceholder')}
            placeholderTextColor={colors.icon}
            multiline
            numberOfLines={6}
            textAlignVertical="top" 
          />
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
            <Text style={styles.saveButtonText}>{t('userProfile.save')}</Text>
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#0B63D6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  formSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    fontSize: 16,
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 30,
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
  textArea: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 15,
    minHeight: 120,
    marginTop: 8,
  },
});
