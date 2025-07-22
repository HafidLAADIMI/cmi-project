// app/(tabs)/index.tsx - Complete Safe Version (No Custom Tailwind)
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { CONFIG } from '../../constants/config';
import { apiService } from '../../services/api';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { CustomAlert } from '../../components/CustomAlert';
import { PaymentCard } from '../../components/PaymentCard';
import { getPendingOrders, FirebaseOrder } from '../../services/orderService';

export default function HomeScreen() {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState<FirebaseOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<FirebaseOrder | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [alert, setAlert] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info' as const,
  });

  // Load orders from Firebase - NO useCallback to avoid dependency issues
  const loadOrders = async () => {
    try {
      console.log('📊 Loading Firebase orders...');
      const firebaseOrders = await getPendingOrders();
      setOrders(firebaseOrders);
      
      // Auto-select first order if none selected
      if (firebaseOrders.length > 0 && !selectedOrder) {
        const firstOrder = firebaseOrders[0];
        setSelectedOrder(firstOrder);
        setCustomerName(firstOrder.customerName);
        setCustomerEmail(firstOrder.customerPhone);
      }
      
      console.log(`✅ Loaded ${firebaseOrders.length} orders`);
    } catch (error) {
      console.error('❌ Error loading orders:', error);
    }
  };

  // Simple useEffect - NO complex dependencies
  useEffect(() => {
    loadOrders();
  }, []);

  // Simple refresh function - NO useCallback
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await apiService.checkHealth();
      const firebaseOrders = await getPendingOrders();
      setOrders(firebaseOrders);
      
      if (CONFIG.FEATURES.HAPTIC_FEEDBACK) {
        await Haptics.selectionAsync();
      }
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const showAlert = (title: string, message: string, type: 'info' | 'success' | 'error' | 'warning' | 'cmi' = 'info') => {
    setAlert({ visible: true, title, message, type });
  };

  const validateForm = () => {
    if (!selectedOrder) {
      showAlert('No Order Selected', 'Please select an order to process payment.', 'warning');
      return false;
    }
    
    if (!customerName.trim()) {
      showAlert('Missing Information', 'Please enter customer name.', 'warning');
      return false;
    }
    
    return true;
  };

  // Payment handler - NO useCallback
  const handlePayment = async () => {
    if (!validateForm()) return;

    if (CONFIG.FEATURES.HAPTIC_FEEDBACK) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setLoading(true);
    
    try {
      // Check backend health
      const isHealthy = await apiService.checkHealth();
      if (!isHealthy) {
        showAlert('Connection Error 🌐', 'Cannot connect to payment server.', 'error');
        return;
      }

      // Convert Firebase order items to API format
      const orderItems = selectedOrder!.items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      }));

      // Initiate CMI payment
      const response = await apiService.initiateCmiPayment(orderItems, {
        name: customerName,
        email: customerEmail,
      });
      
      if (response.success && response.paymentUrl) {
        if (CONFIG.FEATURES.HAPTIC_FEEDBACK) {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        // Navigate to payment screen
        router.push({
          pathname: '/payment',
          params: {
            paymentUrl: response.paymentUrl,
            orderId: response.orderId,
            firebaseOrderId: selectedOrder!.id,
            firebaseUserId: selectedOrder!.userId,
            orderTotal: selectedOrder!.total.toString(),
            customerName,
            customerEmail,
          },
        });
      } else {
        showAlert('Payment Error 🏦', response.error || 'Failed to initiate payment.', 'error');
      }
    } catch (error) {
      console.error('Payment error:', error);
      showAlert('Unexpected Error ⚠️', 'An error occurred. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const selectOrder = (order: FirebaseOrder) => {
    setSelectedOrder(order);
    setCustomerName(order.customerName);
    setCustomerEmail(order.customerPhone);
  };

  return (
    <ScrollView 
      className="flex-1 bg-gray-50 dark:bg-gray-900"
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh}
        />
      }
    >
      <View className="p-6">
        {/* Header - SAFE TAILWIND CLASSES */}
        <Animated.View 
          entering={FadeInDown.delay(100)}
          className="bg-blue-600 rounded-3xl p-8 mb-6"
        >
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-white text-3xl font-bold mb-2">
                CMI Payment v2.0
              </Text>
              <Text className="text-blue-100 text-base">
                Firebase Orders Integration ✅
              </Text>
            </View>
            <View className="bg-white/20 rounded-2xl p-4">
              <Text className="text-4xl">🏦</Text>
            </View>
          </View>
          
          <View className="bg-white/10 rounded-2xl p-4">
            <Text className="text-white font-semibold text-sm">
              📦 {orders.length} Pending Orders • 🔥 Firebase Ready
            </Text>
            <Text className="text-blue-100 text-xs mt-1">
              Real-time sync ✅ • Auto-payment ✅ • Sunmi printing 🖨️
            </Text>
          </View>
        </Animated.View>

        {/* Order Selection - SAFE TAILWIND CLASSES */}
        {orders.length > 0 ? (
          <Animated.View 
            entering={FadeInDown.delay(200)}
            className="bg-white dark:bg-gray-800 rounded-3xl p-6 mb-6"
          >
            <Text className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              📋 Select Order to Pay
            </Text>
            
            {orders.map((order) => (
              <TouchableOpacity
                key={order.id}
                onPress={() => selectOrder(order)}
                className={`p-4 rounded-2xl border-2 mb-3 ${
                  selectedOrder?.id === order.id 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'
                }`}
              >
                <View className="flex-row justify-between items-start">
                  <View className="flex-1">
                    <View className="flex-row items-center mb-2">
                      <Text className="font-bold text-gray-900 dark:text-white text-lg">
                        #{order.id.slice(-6)}
                      </Text>
                      {selectedOrder?.id === order.id && (
                        <View className="ml-2 bg-blue-500 rounded-full px-2 py-1">
                          <Text className="text-white text-xs font-bold">SELECTED</Text>
                        </View>
                      )}
                    </View>
                    
                    <Text className="text-gray-700 dark:text-gray-300 font-medium mb-1">
                      👤 {order.customerName}
                    </Text>
                    <Text className="text-gray-600 dark:text-gray-400 text-sm mb-1">
                      📞 {order.customerPhone}
                    </Text>
                    <Text className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                      📍 {order.address.length > 40 ? order.address.substring(0, 40) + '...' : order.address}
                    </Text>
                    
                    <Text className="text-gray-500 dark:text-gray-400 text-sm">
                      📦 {order.items.length} items
                    </Text>
                  </View>
                  
                  <View className="items-end">
                    <Text className="text-2xl font-bold text-blue-600 mb-1">
                      {order.total.toFixed(2)} ₺
                    </Text>
                    <Text className="text-xs text-gray-500 dark:text-gray-400">
                      {order.createdAt.toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                
                {/* Order Items Preview */}
                <View className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                  {order.items.slice(0, 2).map((item, index) => (
                    <Text key={index} className="text-sm text-gray-600 dark:text-gray-400">
                      • {item.quantity}x {item.name} - {(item.price * item.quantity).toFixed(2)} ₺
                    </Text>
                  ))}
                  {order.items.length > 2 && (
                    <Text className="text-sm text-gray-500 dark:text-gray-500">
                      ... and {order.items.length - 2} more items
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </Animated.View>
        ) : (
          <Animated.View 
            entering={FadeInDown.delay(200)}
            className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-3xl p-6 mb-6"
          >
            <View className="flex-row items-center mb-4">
              <Text className="text-3xl mr-3">📦</Text>
              <Text className="text-yellow-800 dark:text-yellow-200 font-bold text-xl">
                No Pending Orders
              </Text>
            </View>
            <Text className="text-yellow-700 dark:text-yellow-300 text-sm">
              No orders found that need payment. Orders will appear here when customers place them.
            </Text>
          </Animated.View>
        )}

        {/* Customer Information - SAFE TAILWIND CLASSES */}
        <Animated.View 
          entering={FadeInDown.delay(300)}
          className="bg-white dark:bg-gray-800 rounded-3xl p-6 mb-6"
        >
          <View className="flex-row items-center mb-4">
            <View className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-3 mr-4">
              <Text className="text-2xl">👤</Text>
            </View>
            <Text className="text-xl font-bold text-gray-900 dark:text-white">
              Customer Information
            </Text>
          </View>
          
          <View className="mb-4">
            <Text className="text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
              Customer Name
            </Text>
            <TextInput
              value={customerName}
              onChangeText={setCustomerName}
              placeholder="Enter customer name"
              className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white"
            />
          </View>
          
          <View>
            <Text className="text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
              Phone/Email
            </Text>
            <TextInput
              value={customerEmail}
              onChangeText={setCustomerEmail}
              placeholder="Enter phone or email"
              className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white"
            />
          </View>
        </Animated.View>

        {/* Payment Card */}
        <View className="mt-6">
          <PaymentCard
            total={selectedOrder?.total || 0}
            onPress={handlePayment}
            loading={loading}
            delay={400}
          />
        </View>

        {/* Features & Security - SAFE TAILWIND CLASSES */}
        <Animated.View 
          entering={FadeInDown.delay(500)}
          className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-3xl p-6 mt-6"
        >
          <View className="flex-row items-center mb-4">
            <Text className="text-3xl mr-3">🛡️</Text>
            <Text className="text-blue-800 dark:text-blue-200 font-bold text-xl">
              Security Features
            </Text>
          </View>
          
          <View className="flex-row flex-wrap justify-between">
            <View className="items-center w-1/2 mb-4">
              <Text className="text-2xl mb-2">🔒</Text>
              <Text className="text-blue-700 dark:text-blue-300 text-sm font-medium text-center">
                3D Secure Authentication
              </Text>
            </View>
            <View className="items-center w-1/2 mb-4">
              <Text className="text-2xl mb-2">🛡️</Text>
              <Text className="text-blue-700 dark:text-blue-300 text-sm font-medium text-center">
                PCI DSS Compliant
              </Text>
            </View>
            <View className="items-center w-1/2">
              <Text className="text-2xl mb-2">🔐</Text>
              <Text className="text-blue-700 dark:text-blue-300 text-sm font-medium text-center">
                SSL/TLS Encryption
              </Text>
            </View>
            <View className="items-center w-1/2">
              <Text className="text-2xl mb-2">✅</Text>
              <Text className="text-blue-700 dark:text-blue-300 text-sm font-medium text-center">
                Real-time Verification
              </Text>
            </View>
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