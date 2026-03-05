import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';
import { SafeAreaView } from 'react-native-safe-area-context';

interface DrawerHeaderProps {
  navigation: any;
  title: string;
  backButton?: boolean;
}

export default function DrawerHeader({ navigation, title, backButton }: DrawerHeaderProps) {
  const { colorScheme, setTheme, colors } = useTheme();
  const { t } = useLanguage();

  const toggleTheme = () => {
    setTheme(colorScheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <>
      <StatusBar 
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.cardBorder }]}>
          <TouchableOpacity
            style={[styles.menuButton, { backgroundColor: `${colors.primary}15` }]}
            onPress={() => navigation.toggleDrawer()}
          >
          <Ionicons name={backButton ? "arrow-back" : "menu"} size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>{t(`nav.${title}`)}</Text>
          <TouchableOpacity
            style={[styles.themeButton, { backgroundColor: `${colors.primary}15` }]}
            onPress={toggleTheme}
          >
            <Ionicons 
              name={colorScheme === 'dark' ? 'sunny' : 'moon'} 
              size={20} 
              color={colors.primary} 
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  themeButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
