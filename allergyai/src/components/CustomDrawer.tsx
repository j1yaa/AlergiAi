import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';

interface MenuItem {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const menuItems: MenuItem[] = [
  { name: 'Dashboard', label: 'Dashboard', icon: 'home' },
  { name: 'AddMeal', label: 'Add Meal', icon: 'restaurant' },
  { name: 'Scanner', label: 'Scan Food', icon: 'camera' },
  { name: 'Allergens', label: 'Allergens', icon: 'shield' },
  { name: 'Symptoms', label: 'Symptoms', icon: 'medical' },
  { name: 'Alerts', label: 'Alerts', icon: 'warning' },
  { name: 'Profile', label: 'Profile', icon: 'person' },
];

export default function CustomDrawer(props: any) {
  const { state, navigation } = props;
  const currentRoute = state.routes[state.index].name;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Ionicons name="leaf" size={32} color="#4CAF50" />
        </View>
        <Text style={styles.appName}>AllergyAI</Text>
        <Text style={styles.tagline}>Your Health Guardian</Text>
      </View>

      <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
        {menuItems.map((item) => {
          const isActive = currentRoute === item.name;
          return (
            <TouchableOpacity
              key={item.name}
              style={[styles.menuItem, isActive && styles.activeMenuItem]}
              onPress={() => navigation.navigate(item.name)}
            >
              <View style={[styles.iconWrapper, isActive && styles.activeIconWrapper]}>
                <Ionicons
                  name={item.icon}
                  size={20}
                  color={isActive ? '#2196F3' : '#6C757D'}
                />
              </View>
              <Text style={[styles.menuLabel, isActive && styles.activeMenuLabel]}>
                {item.label}
              </Text>
              {isActive && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.version}>Version 1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  appName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 2,
  },
  tagline: {
    fontSize: 12,
    color: '#6C757D',
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
  activeMenuItem: {
    backgroundColor: '#F0F9FF',
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
  activeIconWrapper: {
    backgroundColor: 'transparent',
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#495057',
    flex: 1,
  },
  activeMenuLabel: {
    color: '#2196F3',
    fontWeight: '600',
  },
  activeIndicator: {
    width: 3,
    height: 20,
    borderRadius: 2,
    backgroundColor: '#2196F3',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  version: {
    fontSize: 11,
    color: '#ADB5BD',
    textAlign: 'center',
  },
});
