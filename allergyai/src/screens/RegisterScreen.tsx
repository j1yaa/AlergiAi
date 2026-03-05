import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { register } from '../api/client';
import { useLanguage } from '../hooks/useLanguage';

export default function RegisterScreen({ navigation, onLogin }: { navigation: any; onLogin: () => void }) {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert(t('register.validationError'), t('register.nameRequired'));
      return false;
    }
    if (!email.trim()) {
      Alert.alert(t('register.validationError'), t('register.emailRequired'));
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert(t('register.validationError'), t('register.invalidEmail'));
      return false;
    }
    if (password.length < 6) {
      Alert.alert(t('register.validationError'), t('register.weakPassword'));
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert(t('register.validationError'), t('register.passwordMismatch'));
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const response = await register({ name, email, password });
      await SecureStore.setItemAsync('auth_token', response.token);
      await SecureStore.setItemAsync('user_data', JSON.stringify(response.user));
      Alert.alert(t('register.success'), t('register.accountCreated'), [
        { text: t('register.ok'), onPress: onLogin }
      ]);
    } catch (error: any) {
      console.error('Registration error:', error);
      let errorMessage = t('register.registrationError');

      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = t('register.emailInUse');
            break;
          case 'auth/weak-password':
            errorMessage = t('register.weakPasswordFirebase');
            break;
          case 'auth/invalid-email':
            errorMessage = t('register.invalidEmailFirebase');
            break;
          default:
            errorMessage = error.message || errorMessage;
        }
      }

      Alert.alert(t('register.registrationFailed'), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.title}>{t('register.title')}</Text>
        <Text style={styles.subtitle}>{t('register.subtitle')}</Text>
        
        <TextInput
          style={styles.input}
          placeholder={t('register.fullName')}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
        
        <TextInput
          style={styles.input}
          placeholder={t('register.emailAddress')}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <TextInput
          style={styles.input}
          placeholder={t('register.password')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <TextInput
          style={styles.input}
          placeholder={t('register.confirmPassword')}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
        
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? t('register.creatingAccount') : t('register.createAccount')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.linkButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.linkText}>
            {t('register.alreadyHaveAccount')}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  form: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    paddingTop: 80,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#2196F3',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#2196F3',
    fontSize: 16,
  },
});