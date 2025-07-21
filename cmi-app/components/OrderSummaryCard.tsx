import React from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import type { OrderItem } from '../types';

interface OrderSummaryCardProps {
  items: OrderItem[];
  delay?: number;
}

export function OrderSummaryCard({ items, delay = 0 }: OrderSummaryCardProps) {
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
      <View className="flex-row items-center mb-6">
        <View className="bg-primary-100 dark:bg-primary-900/30 rounded-full p-3 mr-4">
          <Text className="text-2xl">📋</Text>
        </View>
        <View>
          <Text className="text-xl font-bold text-gray-900 dark:text-white">
            Order Summary
          </Text>
          <Text className="text-gray-500 dark:text-gray-400 text-sm">
            {items.length} item{items.length !== 1 ? 's' : ''} in your order
          </Text>
        </View>
      </View>
      
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
    </Animated.View>
  );
}