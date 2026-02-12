import React, { useEffect } from 'react';
import { ThemeProvider } from './src/contexts/ThemeContext';
import RootNavigator from './src/navigation/RootNavigator';
import { useNotificationSetup } from './src/utils/useNotificationSetup';

export default function App() {
  useNotificationSetup();
  
  return (
    <ThemeProvider>
      <RootNavigator />
    </ThemeProvider>
  );
}