import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';

interface MenuItem {
  name: string;
  labelKey: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const menuItems: MenuItem[] = [
  { name: 'Dashboard', labelKey: 'drawer.dashboard', icon: 'home' },
  { name: 'AddMeal', labelKey: 'drawer.logMeal', icon: 'restaurant' },
  { name: 'Scanner', labelKey: 'drawer.scanFood', icon: 'scan' },
  { name: 'Trends', labelKey: 'drawer.trendsInsights', icon: 'trending-up' },
  { name: 'Allergens', labelKey: 'drawer.myAllergens', icon: 'shield-checkmark' },
  { name: 'Symptoms', labelKey: 'drawer.symptoms', icon: 'fitness' },
  { name: 'Alerts', labelKey: 'drawer.alerts', icon: 'notifications' },
  { name: 'Profile', labelKey: 'drawer.settings', icon: 'settings' },
];

export default function CustomDrawer(props: any) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { state, navigation } = props;
  const currentRoute = state.routes[state.index].name;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary, borderBottomColor: colors.cardBorder }]}>
        <View style={styles.logoContainer}>
          <Ionicons name="leaf" size={36} color="#FFFFFF" />
        </View>
        <Text style={styles.appName}>AllergyAI</Text>
        <Text style={styles.tagline}>{t('drawer.tagline')}</Text>
      </View>

      <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
        {menuItems.map((item) => {
          const isActive = currentRoute === item.name;
          return (
            <TouchableOpacity
              key={item.name}
              style={[
                styles.menuItem,
                isActive && [styles.menuItemActive, { backgroundColor: `${colors.primary}15` }]
              ]}
              onPress={() => navigation.navigate(item.name)}
            >
              <View style={[
                styles.iconWrapper,
                isActive && { backgroundColor: colors.primary }
              ]}>
                <Ionicons
                  name={item.icon}
                  size={22}
                  color={isActive ? '#FFFFFF' : colors.icon}
                />
              </View>
              <Text style={[
                styles.menuLabel,
                { color: isActive ? colors.primary : colors.text }
              ]}>
                {t(item.labelKey)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.cardBorder, backgroundColor: colors.surface }]}>
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
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomWidth: 0,
    alignItems: 'center',
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  menuContainer: {
    flex: 1,
    paddingTop: 16,
    paddingHorizontal: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 4,
    borderRadius: 12,
  },
  menuItemActive: {
    borderRadius: 12,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  version: {
    fontSize: 12,
    fontWeight: '500',
  },
});
