import React, { useEffect } from 'react';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { LanguageProvider } from './src/contexts/LanguageContext';
import RootNavigator from './src/navigation/RootNavigator';
import { useNotificationSetup } from './src/utils/useNotificationSetup';

export default function App() {
  useNotificationSetup();

  return (
    <LanguageProvider>
      <ThemeProvider>
        <RootNavigator />
      </ThemeProvider>
    </LanguageProvider>
  );
}