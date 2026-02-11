import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { onAuthStateChange, login } from '../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomDrawer from '../components/CustomDrawer';
import DrawerHeader from '../components/DrawerHeader';

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
const Drawer = createDrawerNavigator();

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

function MainDrawer() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={({ route, navigation }) => ({
        header: () => <DrawerHeader navigation={navigation} title={route.name} />,
        drawerType: 'front',
        drawerStyle: {
          width: 280,
        },
        overlayColor: 'rgba(0,0,0,0.5)',
      })}
    >
      <Drawer.Screen name="Dashboard" component={DashboardScreen} />
      <Drawer.Screen name="AddMeal" component={AddMealScreen} />
      <Drawer.Screen name="Scanner" component={ScannerScreen} options={{ headerShown: false }} />
      <Drawer.Screen name="Allergens" component={AllergenScreen} />
      <Drawer.Screen name="Symptoms" component={SymptomsStack} options={{ headerShown: false }} />
      <Drawer.Screen name="Alerts" component={AlertsScreen} />
      <Drawer.Screen name="Profile">
        {(props) => <ProfileScreen {...props} onLogout={handleLogout} />}
      </Drawer.Screen>
      <Drawer.Screen name="ScanResult" component={ScanResultScreen} options={{ headerShown: false, drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="ReminderSettings" component={ReminderSettingsScreen} options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="AlertSettings" component={AlertSettingsScreen} options={{ drawerItemStyle: { display: 'none' } }} />
    </Drawer.Navigator>
  );
}



function SymptomsStack() {
  return (
    <Stack.Navigator
      screenOptions={({ route, navigation }) => ({
        header: () => <DrawerHeader navigation={navigation} title="Symptoms" />,
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
        <MainDrawer />
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