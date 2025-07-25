import Constants from 'expo-constants';

export const CONFIG = {
  // IMPORTANT: Replace YOUR_IP with your actual IP address
  API_BASE_URL: __DEV__ 
    ? 'http://192.168.1.75:3000'  // ← Change this to your actual IP
    : 'https://your-production-backend.com',
  
  DEEP_LINK_SCHEME: 'cmipaymentapp',
  
  MOCK_ORDER_ITEMS: [
    { id: '1', name: '☕ Premium Espresso', price: 28.50, quantity: 2 },
    { id: '2', name: '🥛 Artisan Cappuccino', price: 42.00, quantity: 1 },
    { id: '3', name: '🥐 Fresh Croissant', price: 18.75, quantity: 1 },
  ],
  
  APP_NAME: 'CMI Payment App',
  VERSION: Constants.expoConfig?.version || '2.0.0',
  
  FEATURES: {
    HAPTIC_FEEDBACK: true,
    DARK_MODE: true,
    PRINT_SERVICE: true, // Enable printing
  }
} as const;