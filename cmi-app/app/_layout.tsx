import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import '../global.css';
import { useDeepLink } from '../hooks/useDeepLink';

export default function RootLayout() {
  const colorScheme = useColorScheme();
   
  // Initialize deep link handling
  useDeepLink();
  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'auto'} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colorScheme === 'dark' ? '#1f2937' : '#3b82f6',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="payment" 
          options={{ 
            title: 'Secure Payment',
            presentation: 'modal'
          }} 
        />
      </Stack>
    </>
  );
}