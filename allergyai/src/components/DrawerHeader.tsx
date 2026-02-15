import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { SafeAreaView } from 'react-native-safe-area-context';

interface DrawerHeaderProps {
  navigation: any;
  title: string;
}

export default function DrawerHeader({ navigation, title }: DrawerHeaderProps) {
  const { colorScheme, setTheme, colors } = useTheme();

  const toggleTheme = () => {
    setTheme(colorScheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <>
      <StatusBar 
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background }
      />
      <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <TouchableOpacity
            style={[styles.menuButton, { backgroundColor: colors.surface }]}
            onPress={() => navigation.toggleDrawer()}
          >
          <Ionicons name="menu" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <TouchableOpacity
            style={[styles.themeButton, { backgroundColor: colors.surface }]}
            onPress={toggleTheme}
          >
            <Ionicons 
              name={colorScheme === 'dark' ? 'sunny' : 'moon'} 
              size={20} 
              color={colors.text} 
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  themeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
