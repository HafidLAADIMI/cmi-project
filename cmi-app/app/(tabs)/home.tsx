import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, useColorScheme } from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { CONFIG } from '../../constants/config';
import { apiService } from '../../services/api';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { CustomAlert } from '../../components/CustomAlert';
import { PaymentCard } from '../../components/PaymentCard';
import { CustomerInfoCard } from '../../components/CustomerInfoCard';
import { OrderSummaryCard } from '../../components/OrderSummaryCard';
import type { OrderItem } from '../../types';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [alert, setAlert] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info' as const,
  });

  const orderItems: OrderItem[] = CONFIG.MOCK_ORDER_ITEMS;
  const orderTotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await apiService.checkHealth();
      if (CONFIG.FEATURES.HAPTIC_FEEDBACK) {
        await Haptics.selectionAsync();
      }
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const showAlert = (title: string, message: string, type: 'info' | 'success' | 'error' | 'warning' | 'cmi' = 'info') => {
    setAlert({ visible: true, title, message, type });
  };

  const validateForm = () => {
    if (!customerName.trim()) {
      showAlert('Missing Information', 'Please enter your full name to proceed with payment.', 'warning');
      return false;
    }
    
    if (!customerEmail.trim()) {
      showAlert('Missing Information', 'Please enter your email address to proceed with payment.', 'warning');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      showAlert('Invalid Email', 'Please enter a valid email address.', 'warning');
      return false;
    }
    
    return true;
  };

  const handleRealCMIPayment = useCallback(async () => {
    if (!validateForm()) return;

    if (CONFIG.FEATURES.HAPTIC_FEEDBACK) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setLoading(true);
    
    try {
      // Check backend health first
      const isHealthy = await apiService.checkHealth();
      if (!isHealthy) {
        showAlert(
          'Connection Error 🌐',
          'Cannot connect to payment server. Please check your internet connection and try again.',
          'error'
        );
        return;
      }

      // Initiate CMI payment
      const response = await apiService.initiateCmiPayment(orderItems, {
        name: customerName,
        email: customerEmail,
      });
      
      if (response.success && response.paymentUrl) {
        // Success haptic feedback
        if (CONFIG.FEATURES.HAPTIC_FEEDBACK) {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        // Navigate to payment screen
        router.push({
          pathname: '/payment',
          params: {
            paymentUrl: response.paymentUrl,
            orderId: response.orderId,
            orderTotal: orderTotal.toString(),
            customerName,
            customerEmail,
          },
        });
      } else {
        showAlert(
          'CMI Payment Error 🏦',
          response.error || 'Failed to initiate CMI payment. Please try again or contact support.',
          'cmi'
        );
      }
    } catch (error) {
      console.error('CMI Payment error:', error);
      showAlert(
        'Unexpected Error ⚠️',
        'An unexpected error occurred while connecting to CMI. Please try again.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  }, [orderItems, orderTotal, customerName, customerEmail]);

  return (
    <ScrollView 
      className="flex-1 bg-gray-50 dark:bg-gray-900"
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh}
          tintColor={colorScheme === 'dark' ? '#ffffff' : '#000000'}
        />
      }
    >
      <View className="p-6">
        {/* Header */}
        <Animated.View 
          entering={FadeInDown.delay(100)}
          className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-3xl p-8 shadow-primary mb-6"
        >
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-white text-3xl font-bold mb-2">
                CMI Payment v2.0
              </Text>
              <Text className="text-blue-100 text-base">
                Real CMI Gateway Integration
              </Text>
            </View>
            <View className="bg-white/20 rounded-2xl p-4">
              <Text className="text-4xl">🏦</Text>
            </View>
          </View>
          
          {/* App Info */}
          <View className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
            <Text className="text-white font-semibold text-sm">
              📱 Version {CONFIG.VERSION} • Expo SDK 52 • React Native 0.75
            </Text>
            <Text className="text-blue-100 text-xs mt-1">
              Fabric ✅ • TurboModules ✅ • 3D Secure ✅
            </Text>
          </View>
        </Animated.View>

        {/* Customer Information */}
        <CustomerInfoCard
          name={customerName}
          email={customerEmail}
          onNameChange={setCustomerName}
          onEmailChange={setCustomerEmail}
          delay={200}
        />

        {/* Order Summary */}
        <View className="my-6">
          <OrderSummaryCard items={orderItems} delay={300} />
        </View>

        {/* Payment Card */}
        <PaymentCard
          total={orderTotal}
          onPress={handleRealCMIPayment}
          loading={loading}
          delay={400}
        />

        {/* Features & Security */}
        <Animated.View 
          entering={FadeInDown.delay(500)}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-3xl p-6 mt-6"
        >
          <View className="flex-row items-center mb-4">
            <Text className="text-3xl mr-3">🛡️</Text>
            <Text className="text-blue-800 dark:text-blue-200 font-bold text-xl">
              Security Features
            </Text>
          </View>
          
          <View className="grid grid-cols-2 gap-4">
            <View className="items-center">
              <Text className="text-2xl mb-2">🔒</Text>
              <Text className="text-blue-700 dark:text-blue-300 text-sm font-medium text-center">
                3D Secure Authentication
              </Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl mb-2">🛡️</Text>
              <Text className="text-blue-700 dark:text-blue-300 text-sm font-medium text-center">
                PCI DSS Compliant
              </Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl mb-2">🔐</Text>
              <Text className="text-blue-700 dark:text-blue-300 text-sm font-medium text-center">
                SSL/TLS Encryption
              </Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl mb-2">✅</Text>
              <Text className="text-blue-700 dark:text-blue-300 text-sm font-medium text-center">
                Real-time Verification
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Configuration Warning */}
        <Animated.View 
          entering={FadeInDown.delay(600)}
          className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-200 dark:border-yellow-700 rounded-3xl p-6 mt-6"
        >
          <View className="flex-row items-center mb-4">
            <Text className="text-3xl mr-3">⚠️</Text>
            <Text className="text-yellow-800 dark:text-yellow-200 font-bold text-xl">
              Configuration Required
            </Text>
          </View>
          
          <Text className="text-yellow-700 dark:text-yellow-300 text-sm leading-6">
            To use real CMI payments, update your configuration:
          </Text>
          
          <View className="mt-4 space-y-2">
            <Text className="text-yellow-800 dark:text-yellow-200 text-sm">
              • <Text className="font-mono bg-yellow-100 dark:bg-yellow-800/30 px-2 py-1 rounded">CLIENT_ID</Text> - Your CMI merchant ID
            </Text>
            <Text className="text-yellow-800 dark:text-yellow-200 text-sm">
              • <Text className="font-mono bg-yellow-100 dark:bg-yellow-800/30 px-2 py-1 rounded">STORE_KEY</Text> - Your CMI secret key
            </Text>
            <Text className="text-yellow-800 dark:text-yellow-200 text-sm">
              • <Text className="font-mono bg-yellow-100 dark:bg-yellow-800/30 px-2 py-1 rounded">YOUR_IP</Text> - Replace with your server IP
            </Text>
          </View>
          
          <View className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-800/30 rounded-xl">
            <Text className="text-yellow-800 dark:text-yellow-200 text-xs font-medium">
              📞 Contact CMI: https://www.cmi.com.tr for merchant account setup
            </Text>
          </View>
        </Animated.View>
      </View>

      <LoadingOverlay 
        visible={loading} 
        message="Connecting to CMI Gateway..." 
        type="cmi"
      />
      
      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert(prev => ({ ...prev, visible: false }))}
      />
    </ScrollView>
  );
}