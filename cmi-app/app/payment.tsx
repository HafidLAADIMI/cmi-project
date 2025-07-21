import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, BackHandler, useColorScheme } from 'react-native';
import { WebView } from 'react-native-webview';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { apiService } from '../services/api';
import { printerService } from '../services/printerService';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { CustomAlert } from '../components/CustomAlert';
import { CONFIG } from '../constants/config';

interface PaymentParams {
  paymentUrl: string;
  orderId: string;
  orderTotal: string;
  customerName?: string;
  customerEmail?: string;
}

export default function PaymentScreen() {
  const params = useLocalSearchParams<PaymentParams>();
  
  const [loading, setLoading] = useState(false);
  const [printingStatus, setPrintingStatus] = useState<'idle' | 'printing' | 'success' | 'failed'>('idle');
  const [webViewVisible, setWebViewVisible] = useState(true);
  const [alert, setAlert] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info' as const,
  });

  const showAlert = useCallback((title: string, message: string, type: 'info' | 'success' | 'error' | 'warning' | 'cmi' = 'info') => {
    setAlert({ visible: true, title, message, type });
  }, []);

  const printReceipt = async (orderData: any) => {
    try {
      setPrintingStatus('printing');
      console.log('🖨️ === RECEIPT PRINTING START ===');
      
      const receiptData = {
        orderId: orderData.id,
        items: CONFIG.MOCK_ORDER_ITEMS,
        total: orderData.total,
        paymentMethod: 'CMI Credit Card',
        timestamp: new Date(),
        customerInfo: {
          name: params.customerName || 'Guest',
          email: params.customerEmail || '',
        },
        storeInfo: {
          name: 'CMI Payment Demo Store',
          address: 'Demo Address, Istanbul, Turkey',
          phone: '+90 XXX XXX XX XX',
          taxId: 'DEMO123456789',
        }
      };

      console.log('🖨️ Printing receipt for order:', orderData.id);
      const printSuccess = await printerService.printReceipt(receiptData);
      
      if (printSuccess) {
        setPrintingStatus('success');
        console.log('✅ Receipt printed successfully!');
        
        // Log to backend
        try {
          const response = await fetch(`${CONFIG.API_BASE_URL}/api/test/print`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: orderData.id,
              receiptData
            }),
          });
          
          if (response.ok) {
            console.log('📝 Print job logged to backend successfully');
          } else {
            console.warn('⚠️ Backend print log failed:', response.status);
          }
        } catch (logError) {
          console.warn('⚠️ Failed to log print job:', logError);
        }
        
        return true;
      } else {
        setPrintingStatus('failed');
        console.error('❌ Receipt printing failed');
        return false;
      }
    } catch (error) {
      setPrintingStatus('failed');
      console.error('🖨️ Print error:', error);
      return false;
    }
  };

  const handlePaymentSuccess = async () => {
    console.log('🎉 === PAYMENT SUCCESS HANDLER ===');
    setLoading(true);
    setWebViewVisible(false);
    
    if (CONFIG.FEATURES.HAPTIC_FEEDBACK) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    try {
      console.log('📊 Checking order status...');
      const response = await apiService.getOrderStatus(params.orderId);
      
      if (response.success && response.order) {
        console.log('✅ Order confirmed:', response.order.status);
        
        if (response.order.status === 'paid') {
          // Print receipt
          const printSuccess = await printReceipt(response.order);
          
          // Show final result
          const finalMessage = `Dear ${params.customerName || 'Customer'},\n\n` +
            `Your payment of ${response.order.total.toFixed(2)} ₺ has been processed successfully!\n\n` +
            `${printSuccess 
              ? '✅ Receipt printed successfully!\nPlease take your receipt from the printer.' 
              : '⚠️ Payment successful but receipt printing failed.\nPlease contact staff for a manual receipt.'
            }\n\n` +
            `Transaction ID: ${response.order.id.slice(-8)}\n` +
            `${params.customerEmail ? `Confirmation sent to: ${params.customerEmail}` : ''}`;

          showAlert(
            printSuccess ? 'Payment & Print Complete! 🎉' : 'Payment Successful! ⚠️',
            finalMessage,
            printSuccess ? 'success' : 'warning'
          );
        } else {
          showAlert(
            'Payment Status Unknown ⚠️',
            `Order status is: ${response.order.status}. Please contact support for assistance.`,
            'warning'
          );
        }
      } else {
        console.warn('⚠️ Order not found or invalid response');
        showAlert(
          'Order Not Found ⚠️',
          'Payment may have been successful but we cannot verify the status. Please contact support.',
          'warning'
        );
      }
    } catch (error) {
      console.error('💥 Error processing payment success:', error);
      showAlert(
        'Processing Error ⚠️',
        'Payment was successful but there was an error processing it. Please contact support with your order ID.',
        'warning'
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentFailure = async () => {
    console.log('❌ Payment failure handler');
    setWebViewVisible(false);
    
    if (CONFIG.FEATURES.HAPTIC_FEEDBACK) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    
    showAlert(
      'Payment Failed ❌',
      'Your payment could not be processed. No charges have been made.\n\nPlease try again or contact support if the issue persists.',
      'error'
    );
  };

  // Enhanced WebView navigation handling
 const handleNavigationStateChange = useCallback((navState: any) => {
  const { url, loading } = navState;
  console.log(`🌐 WebView navigation: ${url} loading: ${loading}`);

  // Don't process while loading
  if (loading) return;

  // Check for hash-based success/failure (NO MORE DEEP LINK WARNINGS!)
  if (url.includes('#success-')) {
    console.log('✅ Payment success detected');
    handlePaymentSuccess();
    return;
  }
  
  if (url.includes('#fail-')) {
    console.log('❌ Payment failure detected');
    handlePaymentFailure();
    return;
  }
}, [params.orderId]);

  // Enhanced WebView request handling
  const handleShouldStartLoadWithRequest = useCallback((request: any) => {
    const { url } = request;
    console.log('🔗 WebView wants to load:', url);
    
    // Handle deep links
    if (url.startsWith('cmipaymentapp://')) {
      console.log('🔗 Intercepting deep link:', url);
      
      // Process the deep link directly
      if (url.includes('payment/success')) {
        console.log('✅ Success deep link intercepted');
        setTimeout(() => handlePaymentSuccess(), 100);
      } else if (url.includes('payment/fail')) {
        console.log('❌ Failure deep link intercepted');
        setTimeout(() => handlePaymentFailure(), 100);
      }
      
      return false; // Don't load in WebView
    }
    
    return true; // Allow normal navigation
  }, []);

  const handleGoBack = useCallback(() => {
    setWebViewVisible(false);
    if (CONFIG.FEATURES.HAPTIC_FEEDBACK) {
      Haptics.selectionAsync();
    }
    showAlert(
      'Payment Cancelled ⏹️',
      'Payment cancelled by user. No charges have been made.',
      'warning'
    );
  }, [showAlert]);

  const handleAlertClose = useCallback(() => {
    setAlert(prev => ({ ...prev, visible: false }));
    setTimeout(() => router.back(), 300);
  }, []);

  // Android back button handling
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (webViewVisible && !loading) {
        handleGoBack();
        return true;
      }
      return false;
    });
    return () => backHandler.remove();
  }, [webViewVisible, loading, handleGoBack]);

  // Validate parameters
  if (!params.paymentUrl || !params.orderId) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-900 p-6">
        <Animated.View entering={FadeIn} className="items-center">
          <Text className="text-red-600 text-xl font-bold mb-4">Invalid Payment Parameters</Text>
          <Text className="text-gray-600 text-center mb-6">
            Payment URL or Order ID is missing. Please try again from the home screen.
          </Text>
          <TouchableOpacity onPress={() => router.back()} className="bg-primary-600 py-3 px-6 rounded-xl">
            <Text className="text-white font-bold">← Go Back</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  const getLoadingMessage = () => {
    switch (printingStatus) {
      case 'printing': return 'Printing your receipt...';
      default: return 'Processing your payment...';
    }
  };

  return (
    <View className="flex-1 bg-white dark:bg-gray-900">
      {/* Header */}
      <Animated.View 
        entering={SlideInUp.duration(400)}
        className="bg-gradient-to-r from-cmi-600 to-cmi-700 px-6 pt-14 pb-6 shadow-cmi"
      >
        <View className="flex-row justify-between items-center">
          <View className="flex-1">
            <Text className="text-white text-2xl font-bold mb-1">🔒 Secure Payment</Text>
            <Text className="text-cmi-100 text-sm">
              Order: {params.orderId.slice(-8)} • {params.customerName || 'Guest'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleGoBack}
            disabled={loading}
            className="bg-white/20 py-3 px-4 rounded-xl disabled:opacity-50 active:scale-95"
          >
            <Text className="text-white font-bold">Cancel</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Amount & Status Display */}
      <Animated.View 
        entering={FadeIn.delay(200)}
        className="bg-gray-50 dark:bg-gray-800 p-6 border-b border-gray-200 dark:border-gray-600"
      >
        <Text className="text-center text-4xl font-bold text-gray-900 dark:text-white mb-2">
          {parseFloat(params.orderTotal).toFixed(2)} <Text className="text-cmi-600">₺</Text>
        </Text>
        
        {/* Print Status */}
        {printingStatus !== 'idle' && (
          <View className="flex-row items-center justify-center mt-4 p-3 bg-white dark:bg-gray-700 rounded-xl">
            <View className={`w-3 h-3 rounded-full mr-3 ${
              printingStatus === 'printing' ? 'bg-yellow-500 animate-pulse' :
              printingStatus === 'success' ? 'bg-green-500' :
              'bg-red-500'
            }`} />
            <Text className="text-gray-800 dark:text-gray-200 font-medium">
              {printingStatus === 'printing' ? '🖨️ Printing receipt...' :
               printingStatus === 'success' ? '✅ Receipt printed successfully' :
               '❌ Receipt printing failed'}
            </Text>
          </View>
        )}

        {/* Security Indicators */}
        <View className="flex-row justify-center space-x-6 mt-4">
          <View className="items-center">
            <View className="bg-green-100 dark:bg-green-900/30 rounded-full p-2 mb-1">
              <Text className="text-lg">🔒</Text>
            </View>
            <Text className="text-green-600 dark:text-green-400 text-xs font-medium">3D Secure</Text>
          </View>
          <View className="items-center">
            <View className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-2 mb-1">
              <Text className="text-lg">🛡️</Text>
            </View>
            <Text className="text-blue-600 dark:text-blue-400 text-xs font-medium">SSL Protected</Text>
          </View>
          <View className="items-center">
            <View className="bg-purple-100 dark:bg-purple-900/30 rounded-full p-2 mb-1">
              <Text className="text-lg">✅</Text>
            </View>
            <Text className="text-purple-600 dark:text-purple-400 text-xs font-medium">PCI Compliant</Text>
          </View>
        </View>
      </Animated.View>

      {/* WebView */}
      {webViewVisible && (
        <View className="flex-1">
          <WebView
            source={{ uri: params.paymentUrl }}
            onNavigationStateChange={handleNavigationStateChange}
            onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
            startInLoadingState={true}
            renderLoading={() => (
              <View className="flex-1 justify-center items-center bg-gray-50">
                <View className="bg-white p-6 rounded-2xl shadow-lg items-center">
                  <View className="w-8 h-8 border-2 border-cmi-600 border-t-transparent rounded-full animate-spin mb-4" />
                  <Text className="text-gray-700 font-medium">Loading payment gateway...</Text>
                </View>
              </View>
            )}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('❌ WebView error:', nativeEvent);
              showAlert(
                'Connection Error 🌐',
                `Failed to load payment page.\n\nError: ${nativeEvent.description}\n\nPlease check your internet connection and try again.`,
                'error'
              );
            }}
            onHttpError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('❌ WebView HTTP error:', nativeEvent);
              showAlert(
                'Payment Gateway Error ⚠️',
                `Payment service error (HTTP ${nativeEvent.statusCode}).\n\nPlease try again in a few moments.`,
                'error'
              );
            }}
            // Enhanced WebView settings
            javaScriptEnabled={true}
            domStorageEnabled={true}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            bounces={false}
            style={{ flex: 1 }}
          />
          
          {/* Debug Info (Development Only) */}
          {__DEV__ && (
            <View className="bg-gray-100 dark:bg-gray-800 p-2 border-t border-gray-200 dark:border-gray-700">
              <Text className="text-xs text-gray-600 dark:text-gray-400 text-center">
                🔗 Deep link scheme: {CONFIG.DEEP_LINK_SCHEME}
              </Text>
            </View>
          )}
        </View>
      )}

      <LoadingOverlay 
        visible={loading} 
        message={getLoadingMessage()}
        type="cmi"
      />
      
      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onClose={handleAlertClose}
        confirmText={alert.type === 'success' ? 'Continue Shopping' : 'OK'}
      />
    </View>
  );
}