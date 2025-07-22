import React from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';

// Updated type to handle both mock and Firebase order items
interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  variations?: any[];
  addons?: any[];
  subtotal?: number;
}

interface OrderSummaryCardProps {
  items: OrderItem[];
  delay?: number;
  title?: string; // Custom title
  orderInfo?: {   // Additional order info for Firebase orders
    orderId?: string;
    customerName?: string;
    status?: string;
  };
}

export function OrderSummaryCard({ 
  items, 
  delay = 0, 
  title = "Order Summary",
  orderInfo 
}: OrderSummaryCardProps) {
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const renderOrderItem = (item: OrderItem, index: number) => (
    <Animated.View
      key={item.id}
      entering={FadeInRight.delay(delay + (index * 100))}
      className="flex-row justify-between items-center py-4 border-b border-gray-100 dark:border-gray-700"
    >
      <View className="flex-1">
        <Text className="text-gray-900 dark:text-white font-semibold text-lg">
          {item.name}
        </Text>
        <Text className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          {item.quantity} × {item.price.toFixed(2)} ₺
        </Text>
        {/* Show variations if available (Firebase orders) */}
        {item.variations && item.variations.length > 0 && (
          <Text className="text-gray-400 dark:text-gray-500 text-xs mt-1">
            {item.variations.map(v => v.name).join(', ')}
          </Text>
        )}
        {/* Show addons if available (Firebase orders) */}
        {item.addons && item.addons.length > 0 && (
          <Text className="text-gray-400 dark:text-gray-500 text-xs">
            + {item.addons.map(a => a.name).join(', ')}
          </Text>
        )}
      </View>
      <Text className="text-gray-900 dark:text-white font-bold text-xl">
        {(item.price * item.quantity).toFixed(2)} ₺
      </Text>
    </Animated.View>
  );

  return (
    <Animated.View
      entering={FadeInRight.delay(delay)}
      className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-primary border border-gray-100 dark:border-gray-700"
    >
      {/* Header */}
      <View className="flex-row items-center mb-6">
        <View className="bg-primary-100 dark:bg-primary-900/30 rounded-full p-3 mr-4">
          <Text className="text-2xl">📋</Text>
        </View>
        <View className="flex-1">
          <Text className="text-xl font-bold text-gray-900 dark:text-white">
            {title}
          </Text>
          <Text className="text-gray-500 dark:text-gray-400 text-sm">
            {items.length} item{items.length !== 1 ? 's' : ''} in your order
          </Text>
          {/* Show Firebase order info if available */}
          {orderInfo && (
            <View className="flex-row items-center mt-1">
              {orderInfo.orderId && (
                <Text className="text-xs text-primary-600 dark:text-primary-400 mr-3">
                  🔥 #{orderInfo.orderId.slice(-6)}
                </Text>
              )}
              {orderInfo.customerName && (
                <Text className="text-xs text-gray-500 dark:text-gray-400 mr-3">
                  👤 {orderInfo.customerName}
                </Text>
              )}
              {orderInfo.status && (
                <Text className="text-xs text-green-600 dark:text-green-400">
                  📊 {orderInfo.status}
                </Text>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Order Items */}
      {items.length > 0 ? (
        <>
          {items.map(renderOrderItem)}
          
          {/* Total Section */}
          <View className="pt-6 mt-6 border-t-2 border-primary-200 dark:border-primary-700">
            <View className="flex-row justify-between items-center">
              <Text className="text-2xl font-bold text-gray-900 dark:text-white">Total:</Text>
              <Text className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                {total.toFixed(2)} ₺
              </Text>
            </View>
            <Text className="text-center text-gray-500 dark:text-gray-400 text-sm mt-2">
              Including 18% VAT
            </Text>
          </View>
        </>
      ) : (
        /* Empty State */
        <View className="py-8 items-center">
          <Text className="text-6xl mb-4">📦</Text>
          <Text className="text-gray-500 dark:text-gray-400 text-lg font-medium">
            No items in order
          </Text>
          <Text className="text-gray-400 dark:text-gray-500 text-sm mt-1">
            Select an order to see items
          </Text>
        </View>
      )}
    </Animated.View>
  );
}