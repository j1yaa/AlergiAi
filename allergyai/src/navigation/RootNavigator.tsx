import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { storage } from '../utils/storage';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import AddMealScreen from '../screens/AddMealScreen';
import AlertsScreen from '../screens/AlertsScreen';
import AlertDetailScreen from '../screens/AlertDetailScreen';
import AddSymptomScreen from '../screens/AddSymptomScreen';
import SymptomHistoryScreen from '../screens/SymptomHistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AllergenScreen from '../screens/AllergenScreen';
import ScannerScreen from '../screens/ScannerScreen';
import ScanResultScreen from '../screens/ScanResultScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'AddMeal') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'Alerts') {
            iconName = focused ? 'warning' : 'warning-outline';
          } else if (route.name === 'Symptoms') {
            iconName = focused ? 'medical' : 'medical-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="AddMeal" component={AddMealScreen} options={{ title: 'Add Meal' }} />
      <Tab.Screen name="Alerts" component={AlertsScreen} options={{ title: 'Alerts' }} />
      <Tab.Screen name="Symptoms" component={SymptomsStack} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

function AlertsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="AlertsList"
        component={AlertsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AlertDetail"
        component={AlertDetailScreen}
        options={{ title: 'Alert Details' }}
      />
    </Stack.Navigator>
  );
}

function SymptomsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="SymptomHistory"
        component={SymptomHistoryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AddSymptom"
        component={AddSymptomScreen}
        options={{ title: 'Log Symptom' }}
      />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await storage.getItem('auth_token');
      setIsAuthenticated(!!token);
    } catch (error) {
      setIsAuthenticated(false);
    }
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  if (isAuthenticated === null) {
    return null; // Loading state
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="AlertDetail" component={AlertDetailScreen} options={{ title: 'Alert Details', headerShown: true }} />
          <Stack.Screen name="Allergens" component={AllergenScreen} options={{ title: 'Manage Allergens', headerShown: true }} />
          <Stack.Screen name="Scanner" component={ScannerScreen} options={{ headerShown: false }} />
          <Stack.Screen name="ScanResult" component={ScanResultScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
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