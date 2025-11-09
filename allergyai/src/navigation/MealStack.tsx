import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MealHistoryScreen from '../screens/MealHistoryScreen';
import SimpleMealScreen from '../screens/SimpleMealScreen';
import OriginalAddMealScreen from '../screens/OriginalAddMealScreen';

const Stack = createStackNavigator();

export default function MealStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MealHistory"
        component={MealHistoryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AddMeal"
        component={SimpleMealScreen}
        options={{ title: 'Log Meal' }}
      />
      <Stack.Screen
        name="AnalyzeMeal"
        component={OriginalAddMealScreen}
        options={{ title: 'Analyze Meal' }}
      />
    </Stack.Navigator>
  );
}