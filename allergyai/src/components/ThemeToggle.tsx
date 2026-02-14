import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';

export const ThemeToggle = () => {
  const { theme, colors, setTheme } = useTheme();
  const screenWidth = Dimensions.get('window').width;

  const options: Array<{ value: 'light' | 'dark' | 'auto'; icon: any; label: string }> = [
    { value: 'light', icon: 'sunny', label: 'Light' },
    { value: 'dark', icon: 'moon', label: 'Dark' },
    { value: 'auto', icon: 'phone-portrait', label: 'Auto' },
  ];

  return (
    <View style={[styles.container, { maxWidth: screenWidth - 40 }]}>
      {options.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.option,
            { backgroundColor: colors.surface },
            theme === option.value && { backgroundColor: colors.primary },
          ]}
          onPress={() => setTheme(option.value)}
        >
          <Ionicons
            name={option.icon}
            size={20}
            color={theme === option.value ? '#fff' : colors.icon}
          />
          <Text
            style={[
              styles.label,
              { color: theme === option.value ? '#fff' : colors.text },
            ]}
            numberOfLines={1}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginTop: 8,
    flexWrap: 'wrap',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
});
