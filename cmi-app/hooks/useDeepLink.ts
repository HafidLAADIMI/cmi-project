// hooks/useDeepLink.ts
import { useEffect } from 'react';
import { Linking } from 'react-native';
import { router } from 'expo-router';

export const useDeepLink = () => {
  useEffect(() => {
    // Handle deep links when app is already open
    const handleDeepLink = (url: string) => {
      console.log('🔗 Deep link received:', url);
      
      if (url.includes('payment/success')) {
        const urlObj = new URL(url);
        const orderId = urlObj.searchParams.get('orderId');
        console.log('✅ Payment success for order:', orderId);
        
        // The payment screen should already handle this via WebView
        // But we can add additional logic here if needed
      } else if (url.includes('payment/fail')) {
        const urlObj = new URL(url);
        const orderId = urlObj.searchParams.get('orderId');
        console.log('❌ Payment failed for order:', orderId);
        
        // Additional failure handling if needed
      }
    };

    // Get initial URL if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('🚀 App opened with deep link:', url);
        handleDeepLink(url);
      }
    });

    // Listen for deep links while app is running
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    return () => {
      subscription?.remove();
    };
  }, []);
};