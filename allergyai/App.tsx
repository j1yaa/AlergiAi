import React from 'react';
import RootNavigator from './src/navigation/RootNavigator';
import { useNotificationSetup } from './src/utils/useNotificationSetup';

export default function App() {
  useNotificationSetup();
  return <RootNavigator />;
}