// app/_layout.tsx - CORRECTED VERSION
import "../global.css";
import { Slot } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    // Wrap your entire app with SafeAreaProvider
    <SafeAreaProvider>
      <Slot />
    </SafeAreaProvider>
  );
}