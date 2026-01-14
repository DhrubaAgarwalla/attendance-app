import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import { StoreProvider } from './src/contexts/StoreContext';
import { AppNavigator } from './src/navigation';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StoreProvider>
          <AppNavigator />
        </StoreProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
