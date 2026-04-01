import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { login } from '../api/client';
import { useLanguage } from '../hooks/useLanguage';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../config/firebase';

export default function LoginScreen({ navigation, onLogin }: { navigation: any; onLogin: () => void }) {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    loadSavedCredentials();
  }, []);

  const loadSavedCredentials = async () => {
    try {
      const savedEmail = await AsyncStorage.getItem('saved_email');
      const savedPassword = await AsyncStorage.getItem('saved_password');
      if (savedEmail && savedPassword) {
        setEmail(savedEmail);
        setPassword(savedPassword);
        setRememberMe(true);
      }
    } catch (error) {
      console.log('Failed to load saved credentials:', error);
    }
  };

  const saveCredentials = async () => {
    try {
      if (rememberMe) {
        await AsyncStorage.setItem('saved_email', email);
        await AsyncStorage.setItem('saved_password', password);
      } else {
        await AsyncStorage.removeItem('saved_email');
        await AsyncStorage.removeItem('saved_password');
      }
    } catch (error) {
      console.log('Failed to save credentials:', error);
    }
  };

  const validateForm = () => {
    if (!email.trim()) {
      Alert.alert(t('login.validationError'), t('login.emailRequired'));
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert(t('login.validationError'), t('login.invalidEmail'));
      return false;
    }
    if (!password.trim()) {
      Alert.alert(t('login.validationError'), t('login.passwordRequired'));
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const response = await login({ email, password });
      await saveCredentials();
      console.log('Login successful:', response.user.email);
      onLogin();
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.message || 'Invalid email or password';
      Alert.alert(t('login.loginFailed'), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (Platform.OS === 'ios') { 
      Alert.prompt(
        t('login.forgotPassword'),
        'Enter your email address to receive a password reset link',
        [
          {text: t('common.cancel'), style: 'cancel'},
          {
            text: 'Send Reset Link',
            onPress: async (resetEmail?: string) => {
              if (!resetEmail || !resetEmail.trim()) {
                Alert.alert('Error', 'Please enter your email address');
                return;
              }
              await sendPasswordReset(resetEmail.trim());
            }
          }
        ],
        'plain-text',
        email
      );
    } else {
      if (email && email.trim()) {
        Alert.alert(
          t('login.forgotPassword'),
          `Send password reset link to ${email}?`,
          [
            {text: t('common.cancel'), style: 'cancel'},
            {
              text: 'Send Reset Link',
              onPress: () => sendPasswordReset(email.trim())
            }
          ]
        );
      } else {
        Alert.alert(
          t('login.forgotPassword'),
          'Please enter your email address in the email field above and try again.'
        );
      }
    }
  };

  const sendPasswordReset = async (resetEmail: string) => {
    try {
      await sendPasswordResetEmail(auth, resetEmail);
        Alert.alert('Success', 'Password reset email was sent! Check your inbox.');
    } catch (error: any) {
      console.error('Password reset error:', error);
      if (error.code === 'auth/user-not-found') {
        Alert.alert('Error', 'No account found with this email address');
      } else if (error.code === 'auth/invalid-email') {
        Alert.alert('Error', 'Invalid email address');
      } else {
        Alert.alert('Error', 'Failed to send the reset email. Please try again.');
      }
    }
  };

  const handleGoogleSignIn = () => {
    Alert.alert(
      'Google Sign-In',
      'Google authentication is not configured yet. Please use email/password login or contact support.',
      [{text: 'OK'}]
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', android: undefined })}
      style={styles.screen}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <View style={styles.brand}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>AI</Text>
            </View>
            <Text style={styles.appName}>AllergyAI</Text>
            <Text style={styles.subtitle}>{t('login.subtitle')}</Text>
          </View>

          <View style={styles.card}>
            <TextInput
              style={styles.input}
              placeholder={t('login.email')}
              placeholderTextColor="#9AA4B2"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
            />
            <TextInput
              style={styles.input}
              placeholder={t('login.password')}
              placeholderTextColor="#9AA4B2"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="password"
            />

            <TouchableOpacity
              style={styles.rememberMeRow}
              onPress={() => setRememberMe(!rememberMe)}
            >
              <Ionicons
                name={rememberMe ? 'checkbox' : 'checkbox-outline'}
                size={20}
                color={rememberMe ? ACCENT : '#9AA4B2'}
              />
              <Text style={styles.rememberMeText}>{t('login.rememberMe')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#0B3D91" />
              ) : (
                <Text style={styles.buttonText}>{t('login.loginButton')}</Text>
              )}
            </TouchableOpacity>

            <View style={styles.row}>
              <TouchableOpacity onPress={handleForgotPassword}>
                <Text style={styles.link}>{t('login.forgotPassword')}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.link}>{t('login.createAccount')}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t('login.or')}</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialRow}>
              <TouchableOpacity
                style={[styles.socialButton, styles.google]}
                onPress={handleGoogleSignIn}
              >
                <Text style={styles.socialText}>{t('login.continueGoogle')}</Text>
              </TouchableOpacity>
            </View>
          </View>


          <Text style={styles.footer}>{t('login.footer')}</Text>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const ACCENT = '#0B63D6';
const LIGHT_BG = '#F6F9FF';
const CARD_BG = '#FFFFFF';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: LIGHT_BG,
  },
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 80,
    justifyContent: 'flex-start',
  },

  // brand / header
  brand: {
    alignItems: 'center',
    marginBottom: 18,
  },
  logoCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: CARD_BG,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    marginBottom: 10,
  },
  logoText: {
    color: ACCENT,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#072B5A',
  },
  subtitle: {
    marginTop: 4,
    color: '#5C6B7A',
    fontSize: 13,
    textAlign: 'center',
  },

  // card
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 18,
    marginTop: 8,
    marginBottom: 100,
    marginHorizontal: 4,
    // shadow (iOS)
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    // elevation (Android)
    elevation: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E6EDF6',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
    borderRadius: 10,
    fontSize: 16,
    backgroundColor: '#FBFDFF',
    color: '#0B2132',
  },

  button: {
    backgroundColor: ACCENT,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingHorizontal: 4,
  },
  link: {
    color: ACCENT,
    fontSize: 13,
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E8EEF8',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#8E99A8',
    fontSize: 12,
  },

  socialRow: {
    marginTop: 6,
  },
  socialButton: {
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
  },
  google: {
    borderWidth: 1,
    borderColor: '#E6EDF6',
    backgroundColor: '#FFF',
  },
  socialText: {
    color: '#1F2D3D',
    fontWeight: '600',
  },

  footer: {
    marginTop: 60,
    textAlign: 'center',
    color: '#9CA9B8',
    fontSize: 12,
  },
  rememberMeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  rememberMeText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#5C6B7A',
  },

});
