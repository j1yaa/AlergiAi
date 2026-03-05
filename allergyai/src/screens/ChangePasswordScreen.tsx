import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { auth } from '../config/firebase';
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../hooks/useLanguage';

export default function ChangePasswordScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert(t('common.error'), t('changePassword.passwordsMismatch'));
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert(t('common.error'), t('changePassword.passwordTooShort'));
      return;
    }

    setSaving(true);
    try {
      const user = auth.currentUser;
      if (!user || !user.email) throw new Error('Not authenticated');

      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      await AsyncStorage.setItem('saved_password', newPassword);

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert(t('common.success'), t('changePassword.passwordUpdated'));
    } catch (error: any) {
      if (error.code === 'auth/wrong-password') {
        Alert.alert(t('common.error'), t('changePassword.incorrectPassword'));
      } else {
        Alert.alert(t('common.error'), error.message || t('changePassword.failedToUpdate'));
      }
    } finally {
      setSaving(false);
    }
  };

  const isReady = currentPassword.length > 0 && newPassword.length > 0 && confirmPassword.length > 0;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>{t('changePassword.title')}</Text>

        <View style={styles.formSection}>
          <Text style={[styles.inputLabel, { color: colors.icon }]}>{t('changePassword.currentPassword')}</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.cardBorder, color: colors.text }]}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder={t('changePassword.enterCurrent')}
            placeholderTextColor={colors.icon}
            secureTextEntry
          />

          <Text style={[styles.inputLabel, { color: colors.icon }]}>{t('changePassword.newPassword')}</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.cardBorder, color: colors.text }]}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder={t('changePassword.enterNew')}
            placeholderTextColor={colors.icon}
            secureTextEntry
          />

          <Text style={[styles.inputLabel, { color: colors.icon }]}>{t('changePassword.confirmPassword')}</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.cardBorder, color: colors.text }]}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder={t('changePassword.confirmNew')}
            placeholderTextColor={colors.icon}
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }, !isReady && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={!isReady || saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>{t('changePassword.save')}</Text>
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 30,
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
});
