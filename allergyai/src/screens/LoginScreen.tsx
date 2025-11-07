import React, { useState } from 'react';
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
import * as SecureStore from 'expo-secure-store';
import { storage } from '../utils/storage';
import { login } from '../api/client';

export default function LoginScreen({ navigation, onLogin }: { navigation: any; onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!email.trim()) {
      Alert.alert('Validation Error', 'Email is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return false;
    }
    if (!password.trim()) {
      Alert.alert('Validation Error', 'Password is required');
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const response = await login({ email, password });
      await SecureStore.setItemAsync('auth_token', response.token);
      await storage.setItem('auth_token', response.token);
      await SecureStore.setItemAsync('user_data', JSON.stringify(response.user));
      onLogin();
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Invalid email or password';
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setLoading(false);
    }
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
            <Text style={styles.subtitle}>Understand your environment. Reduce surprises.</Text>
          </View>

          <View style={styles.card}>
            <TextInput
              style={styles.input}
              placeholder="Email"
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
              placeholder="Password"
              placeholderTextColor="#9AA4B2"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="password"
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#0B3D91" />
              ) : (
                <Text style={styles.buttonText}>Login</Text>
              )}
            </TouchableOpacity>

            <View style={styles.row}>
              <TouchableOpacity onPress={() => Alert.alert('Forgot Password', 'Reset flow placeholder')}>
                <Text style={styles.link}>Forgot password?</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.link}>Create account</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialRow}>
              <TouchableOpacity
                style={[styles.socialButton, styles.google]}
                onPress={() => Alert.alert('Google sign-in placeholder')}
              >
                <Text style={styles.socialText}>Continue with Google</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.demoSection}>
            <Text style={styles.demoTitle}>Demo Accounts:</Text>
            <TouchableOpacity onPress={() => { setEmail('john@example.com'); setPassword('password'); }}>
              <Text style={styles.demoText}>john@example.com / password</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setEmail('jane@example.com'); setPassword('password123'); }}>
              <Text style={styles.demoText}>jane@example.com / password123</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.footer}>Privacy-first allergy insights • Data stored securely</Text>
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
    justifyContent: 'center',
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
    marginTop: 18,
    textAlign: 'center',
    color: '#9CA9B8',
    fontSize: 12,
  },
  demoSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#666',
  },
  demoText: {
    fontSize: 14,
    color: '#2196F3',
    marginBottom: 5,
  },
});
