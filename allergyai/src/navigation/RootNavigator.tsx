import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';

import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import AddMealScreen from '../screens/AddMealScreen';
import AlertsScreen from '../screens/AlertsScreen';
import AlertDetailScreen from '../screens/AlertDetailScreen';

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
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="AddMeal" component={AddMealScreen} options={{ title: 'Add Meal' }} />
      <Tab.Screen name="Alerts" component={AlertsScreen} />
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

export default function RootNavigator() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
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
          <Stack.Screen name="AlertDetail" component={AlertDetailScreen} />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login">
            {(props) => <LoginScreen {...props} onLogin={handleLogin} />}
          </Stack.Screen>
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}