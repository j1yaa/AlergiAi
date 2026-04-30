import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../hooks/useTheme';
import { getProfile, getUserSettings, updateUserSettings } from '../api/client';
import { auth } from '../config/firebase';
import {
  updateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
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

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [originalProfileImage, setOriginalProfileImage] = useState<string | null>(null);
  const [pendingImageUri, setPendingImageUri] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [profile, alertSettings, savedImage] = await Promise.all([
        getProfile(),
        getAlertSettings(),
        AsyncStorage.getItem('profile_picture_uri')
      ]);
      if (savedImage) {
        setProfileImage(savedImage);
        setOriginalProfileImage(savedImage);
      }
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

  const savePermanentImage = async (tempUri: string): Promise<string> => {
    const fileName = `profile_picture_${Date.now()}.jpg`;
    const permanentUri = `${FileSystem.documentDirectory}${fileName}`;
    await FileSystem.copyAsync({ from: tempUri, to: permanentUri });
    return permanentUri;
  };

  const handlePickImage = () => {
    Alert.alert('Profile Photo', 'Choose a photo source', [
      {
        text: 'Camera',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission needed', 'Camera access is required to take a photo.');
            return;
          }
          const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 });
          if (!result.canceled) {
            const permanent = await savePermanentImage(result.assets[0].uri);
            setPendingImageUri(permanent);
            setImageError(false);
          }
        }
      },
      {
        text: 'Photo Library',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission needed', 'Photo library access is required.');
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 });
          if (!result.canceled) {
            const permanent = await savePermanentImage(result.assets[0].uri);
            setPendingImageUri(permanent);
            setImageError(false);
          }
        }
      },
      { text: 'Cancel', style: 'cancel' }
    ]);
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

      if (pendingImageUri) {
        const permanent = await savePermanentImage(pendingImageUri);
        await AsyncStorage.setItem('profile_picture_uri', permanent);
        setProfileImage(permanent);
        setOriginalProfileImage(permanent);
        setPendingImageUri(null);
      } else if (profileImage !== originalProfileImage) {
        if (profileImage) {
          await AsyncStorage.setItem('profile_picture_uri', profileImage);
        } else {
          await AsyncStorage.removeItem('profile_picture_uri');
        }
        setOriginalProfileImage(profileImage);
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

  const displayImage = pendingImageUri || profileImage;
  const hasChanges = name !== originalName || email !== originalEmail || phone !== originalPhone || medicalNotes !== originalMedicalNotes || profileImage !== originalProfileImage || pendingImageUri !== null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handlePickImage} style={styles.avatarWrapper}>
            {displayImage && !imageError ? (
              <Image
                source={{ uri: displayImage }}
                style={styles.avatarImage}
                onError={() => setImageError(true)}
              />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase() || '?'}
                </Text>
              </View>
            )}
            <View style={styles.cameraIconBadge}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          </TouchableOpacity>
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
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#0B63D6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#0B63D6',
    borderRadius: 12,
    width: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
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
