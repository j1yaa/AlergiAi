import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { isAndroid, getPlatformStyle } from '../utils/platform';
import { AndroidTheme } from '../../constants/theme';

interface AndroidCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevation?: 'low' | 'medium' | 'high';
}

export const AndroidCard: React.FC<AndroidCardProps> = ({ 
  children, 
  style, 
  elevation = 'medium' 
}) => {
  const platformStyle = getPlatformStyle();
  const elevationValue = isAndroid ? AndroidTheme.elevation[elevation] : 0;

  return (
    <View style={[
      styles.card,
      platformStyle,
      isAndroid && { elevation: elevationValue },
      style
    ]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: AndroidTheme.borderRadius.md,
    padding: AndroidTheme.spacing.md,
    margin: AndroidTheme.spacing.sm,
  },
});