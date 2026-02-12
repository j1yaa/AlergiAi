import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';

interface MenuItem {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const menuItems: MenuItem[] = [
  { name: 'Dashboard', label: 'Dashboard', icon: 'home' },
  { name: 'AddMeal', label: 'Add Meal', icon: 'restaurant' },
  { name: 'Scanner', label: 'Scan Food', icon: 'camera' },
  { name: 'Trends', label: 'Meal Trends', icon: 'stats-chart' },
  { name: 'Allergens', label: 'Allergens', icon: 'shield' },
  { name: 'Symptoms', label: 'Symptoms', icon: 'medical' },
  { name: 'SymptomCorrelation', label: 'Symptom Correlation', icon: 'analytics' },
  { name: 'Alerts', label: 'Alerts', icon: 'warning' },
  { name: 'ReminderSettings', label: 'Meal Reminders', icon: 'notifications' },
  { name: 'Profile', label: 'Profile', icon: 'person' },
];

export default function CustomDrawer(props: any) {
  const { colors } = useTheme();
  const { state, navigation } = props;
  const currentRoute = state.routes[state.index].name;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.surface }]}>
        <View style={[styles.logoContainer, { backgroundColor: colors.surface }]}>
          <Ionicons name="leaf" size={32} color="#4CAF50" />
        </View>
        <Text style={[styles.appName, { color: colors.text }]}>AllergyAI</Text>
        <Text style={[styles.tagline, { color: colors.icon }]}>Your Health Guardian</Text>
      </View>

      <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
        {menuItems.map((item) => {
          const isActive = currentRoute === item.name;
          return (
            <TouchableOpacity
              key={item.name}
              style={[styles.menuItem, isActive && { backgroundColor: colors.surface }]}
              onPress={() => navigation.navigate(item.name)}
            >
              <View style={styles.iconWrapper}>
                <Ionicons
                  name={item.icon}
                  size={20}
                  color={isActive ? colors.primary : colors.icon}
                />
              </View>
              <Text style={[styles.menuLabel, { color: isActive ? colors.primary : colors.text }]}>
                {item.label}
              </Text>
              {isActive && <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.surface }]}>
        <Text style={[styles.version, { color: colors.icon }]}>Version 1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  appName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 2,
  },
  tagline: {
    fontSize: 12,
  },
  menuContainer: {
    flex: 1,
    paddingTop: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    marginBottom: 2,
    borderRadius: 8,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  activeIndicator: {
    width: 3,
    height: 20,
    borderRadius: 2,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  version: {
    fontSize: 11,
    textAlign: 'center',
  },
});
