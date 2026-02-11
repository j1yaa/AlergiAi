import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { onAuthStateChange, login } from '../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ProfessionalHeader from '../components/ProfessionalHeader';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import AddMealScreen from '../screens/AddMealScreen';
import AlertsScreen from '../screens/AlertsScreen';
import AddSymptomScreen from '../screens/AddSymptomScreen';
import SymptomHistoryScreen from '../screens/SymptomHistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AllergenScreen from '../screens/AllergenScreen';
import ScannerScreen from '../screens/ScannerScreen';
import ScanResultScreen from '../screens/ScanResultScreen';
import ReminderSettingsScreen from '../screens/ReminderSettingsScreen';
import AlertSettingsScreen from '../screens/AlertSettingsScreen';

const Stack = createStackNavigator();

export default function RootNavigator() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  console.log('RootNavigator rendered, isAuthenticated:', isAuthenticated);

  useEffect(() => {
    const unsubscribe = checkAuthStatus();
    return unsubscribe;
  }, []);

  const checkAuthStatus = () => {
    console.log('Setting up Firebase auth listener');
    try {
      const unsubscribe = onAuthStateChange(async (user) => {
        console.log('Firebase auth state changed:', !!user);
        
        if (!user) {
          // Try auto-login if user is not authenticated
          const autoLoginSuccess = await tryAutoLogin();
          setIsAuthenticated(autoLoginSuccess);
        } else {
          setIsAuthenticated(true);
        }
      });
      return unsubscribe;
    } catch (error) {
      console.error('Firebase auth setup failed:', error);
      setIsAuthenticated(false);
      return () => {};
    }
  };

  const tryAutoLogin = async (): Promise<boolean> => {
    try {
      const [savedEmail, rememberMe, savedPassword] = await Promise.all([
        AsyncStorage.getItem('saved_email'),
        AsyncStorage.getItem('remember_me'),
        AsyncStorage.getItem('saved_password')
      ]);
      
      if (savedEmail && rememberMe === 'true' && savedPassword) {
        console.log('Attempting auto-login for:', savedEmail);
        await login({ email: savedEmail, password: savedPassword });
        console.log('Auto-login successful');
        return true;
      }
    } catch (error) {
      console.error('Auto-login failed:', error);
      // Clear saved credentials if auto-login fails
      AsyncStorage.removeItem('saved_password');
    }
    return false;
  };

const handleLogin = () => {
    setIsAuthenticated(true);
};

const handleLogout = () => {
  console.log('handleLogout called in RootNavigator');
  setIsAuthenticated(false);
};

function MainStack() {
  return (
    <Stack.Navigator
      screenOptions={({ route, navigation }) => ({
        header: () => (
          <ProfessionalHeader 
            navigation={navigation} 
            currentScreen={route.name}
          />
        ),
      })}
    >
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="AddMeal" component={AddMealScreen} />
      <Stack.Screen name="Alerts" component={AlertsScreen} />
      <Stack.Screen name="Symptoms" component={SymptomsStack} options={{ headerShown: false }} />
      <Stack.Screen name="Profile">
        {(props) => <ProfileScreen {...props} onLogout={handleLogout} />}
      </Stack.Screen>
      <Stack.Screen name="Allergens" component={AllergenScreen} />
      <Stack.Screen name="Scanner" component={ScannerScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ScanResult" component={ScanResultScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ReminderSettings" component={ReminderSettingsScreen} />
      <Stack.Screen name="AlertSettings" component={AlertSettingsScreen} />
    </Stack.Navigator>
  );
}



function SymptomsStack() {
  return (
    <Stack.Navigator
      screenOptions={({ route, navigation }) => ({
        header: () => (
          <ProfessionalHeader 
            navigation={navigation} 
            currentScreen="Symptoms"
          />
        ),
      })}
    >
      <Stack.Screen
        name="SymptomHistory"
        component={SymptomHistoryScreen}
      />
      <Stack.Screen
        name="AddSymptom"
        component={AddSymptomScreen}
      />
    </Stack.Navigator>
  );
}

  if (isAuthenticated === null) {
    console.log('Showing loading state');
    return null; // Loading state
  }

  console.log('Rendering navigation, isAuthenticated:', isAuthenticated);

  return (
    <NavigationContainer>
      {isAuthenticated ? (
        <MainStack />
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login">
            {(props) => <LoginScreen {...props} onLogin={handleLogin} />}
          </Stack.Screen>
          <Stack.Screen name="Register">
            {(props) => <RegisterScreen {...props} onLogin={handleLogin} />}
          </Stack.Screen>
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}