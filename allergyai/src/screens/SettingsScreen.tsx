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
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAlertSettings, saveAlertSettings } from '../utils/allergenAlertService';

export default function SettingsScreen() {
  const { colors } = useTheme();

  // Account Info
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [originalName, setOriginalName] = useState('');
  const [originalEmail, setOriginalEmail] = useState('');

  // Change Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Emergency Contact
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [originalEmergencyPhone, setOriginalEmergencyPhone] = useState('');

  // UI state
  const [loading, setLoading] = useState(true);
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingContact, setSavingContact] = useState(false);

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
      setEmergencyPhone(alertSettings.emergencyContactPhone || '');
      setOriginalEmergencyPhone(alertSettings.emergencyContactPhone || '');
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAccount = async () => {
    setSavingAccount(true);
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
          setSavingAccount(false);
          return;
        }
        const credential = EmailAuthProvider.credential(user.email!, password);
        await reauthenticateWithCredential(user, credential);
        await updateEmail(user, email);
        const settings = await getUserSettings();
        await updateUserSettings({ ...settings, email });
        await AsyncStorage.setItem('saved_email', email);
      }

      setOriginalName(name);
      setOriginalEmail(email);
      Alert.alert('Success', 'Account info updated.');
    } catch (error: any) {
      if (error.code === 'auth/wrong-password') {
        Alert.alert('Error', 'Incorrect password. Please try again.');
      } else {
        Alert.alert('Error', error.message || 'Failed to update account info.');
      }
    } finally {
      setSavingAccount(false);
    }
  };

  const promptForPassword = (): Promise<string | null> => {
    return new Promise((resolve) => {
      Alert.prompt(
        'Confirm Password',
        'Enter your current password to update your email.',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
          { text: 'Confirm', onPress: (password) => resolve(password || null) }
        ],
        'secure-text'
      );
    });
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }

    setSavingPassword(true);
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
      Alert.alert('Success', 'Password updated.');
    } catch (error: any) {
      if (error.code === 'auth/wrong-password') {
        Alert.alert('Error', 'Current password is incorrect.');
      } else {
        Alert.alert('Error', error.message || 'Failed to update password.');
      }
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSaveContact = async () => {
    setSavingContact(true);
    try {
      const alertSettings = await getAlertSettings();
      await saveAlertSettings({ ...alertSettings, emergencyContactPhone: emergencyPhone });
      setOriginalEmergencyPhone(emergencyPhone);
      Alert.alert('Success', 'Emergency contact updated.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update emergency contact.');
    } finally {
      setSavingContact(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.icon }]}>Loading settings...</Text>
      </View>
    );
  }

  const accountChanged = name !== originalName || email !== originalEmail;
  const passwordReady = currentPassword.length > 0 && newPassword.length > 0 && confirmPassword.length > 0;
  const contactChanged = emergencyPhone !== originalEmergencyPhone;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="settings" size={32} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
          <Text style={[styles.subtitle, { color: colors.icon }]}>
            Manage your account and preferences
          </Text>
        </View>

        {/* Account Info */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Account Info</Text>

          <Text style={[styles.inputLabel, { color: colors.icon }]}>Name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.cardBorder, color: colors.text }]}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={colors.icon}
          />

          <Text style={[styles.inputLabel, { color: colors.icon }]}>Email</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.cardBorder, color: colors.text }]}
            value={email}
            onChangeText={setEmail}
            placeholder="Your email"
            placeholderTextColor={colors.icon}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }, !accountChanged && styles.buttonDisabled]}
            onPress={handleSaveAccount}
            disabled={!accountChanged || savingAccount}
          >
            {savingAccount ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Change Password */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Change Password</Text>

          <Text style={[styles.inputLabel, { color: colors.icon }]}>Current Password</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.cardBorder, color: colors.text }]}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Enter current password"
            placeholderTextColor={colors.icon}
            secureTextEntry
          />

          <Text style={[styles.inputLabel, { color: colors.icon }]}>New Password</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.cardBorder, color: colors.text }]}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Enter new password"
            placeholderTextColor={colors.icon}
            secureTextEntry
          />

          <Text style={[styles.inputLabel, { color: colors.icon }]}>Confirm New Password</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.cardBorder, color: colors.text }]}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm new password"
            placeholderTextColor={colors.icon}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }, !passwordReady && styles.buttonDisabled]}
            onPress={handleChangePassword}
            disabled={!passwordReady || savingPassword}
          >
            {savingPassword ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Update Password</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Emergency Contact */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Emergency Contact</Text>
          <Text style={[styles.description, { color: colors.icon }]}>
            This number will be notified for high-risk allergen alerts
          </Text>

          <Text style={[styles.inputLabel, { color: colors.icon }]}>Phone Number</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.cardBorder, color: colors.text }]}
            value={emergencyPhone}
            onChangeText={setEmergencyPhone}
            placeholder="Enter phone number"
            placeholderTextColor={colors.icon}
            keyboardType="phone-pad"
          />

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }, !contactChanged && styles.buttonDisabled]}
            onPress={handleSaveContact}
            disabled={!contactChanged || savingContact}
          >
            {savingContact ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Contact</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={[styles.infoBox, { backgroundColor: `${colors.primary}15` }]}>
          <Ionicons name="information-circle" size={20} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.primary }]}>
            Email and password changes require recent authentication for security.
          </Text>
        </View>
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
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  description: {
    fontSize: 13,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 16,
    marginBottom: 4,
  },
  saveButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 8,
    marginBottom: 40,
  },
  infoText: {
    marginLeft: 10,
    fontSize: 13,
    flex: 1,
  },
});
