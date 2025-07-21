import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { apiService } from '../../services/api';
import { LoadingOverlay } from '../../components/LoadingOverlay';

export default function AnalyticsScreen() {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const clearCache = async () => {
    setLoading(true);
    await apiService.clearCache();
    setLoading(false);
  };

  return (
    <ScrollView 
      className="flex-1 bg-gray-50 dark:bg-gray-900"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View className="p-6">
        {/* Header */}
        <Animated.View 
          entering={FadeInDown.delay(100)}
          className="mb-6"
        >
          <Text className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            📊 Analytics
          </Text>
          <Text className="text-gray-600 dark:text-gray-300">
            Payment insights and statistics
          </Text>
        </Animated.View>

        {/* Stats Cards */}
        <Animated.View 
          entering={FadeInDown.delay(200)}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm mb-4"
        >
          <View className="flex-row items-center mb-4">
            <Text className="text-4xl mr-4">📦</Text>
            <View>
              <Text className="text-gray-600 dark:text-gray-300 text-sm">Total Orders</Text>
              <Text className="text-2xl font-bold text-gray-900 dark:text-white">12</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View 
          entering={FadeInDown.delay(300)}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm mb-4"
        >
          <View className="flex-row items-center mb-4">
            <Text className="text-4xl mr-4">✅</Text>
            <View>
              <Text className="text-gray-600 dark:text-gray-300 text-sm">Successful Payments</Text>
              <Text className="text-2xl font-bold text-green-600">10</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View 
          entering={FadeInDown.delay(400)}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm mb-6"
        >
          <View className="flex-row items-center mb-4">
            <Text className="text-4xl mr-4">💰</Text>
            <View>
              <Text className="text-gray-600 dark:text-gray-300 text-sm">Total Revenue</Text>
              <Text className="text-2xl font-bold text-gray-900 dark:text-white">1,247.50 ₺</Text>
            </View>
          </View>
        </Animated.View>

        {/* Actions */}
        <Animated.View entering={FadeInDown.delay(500)} className="space-y-3">
          <TouchableOpacity
            onPress={onRefresh}
            className="bg-primary-600 py-4 px-6 rounded-xl"
          >
            <Text className="text-white text-center font-semibold">
              🔄 Refresh Data
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={clearCache}
            className="bg-gray-600 py-4 px-6 rounded-xl"
          >
            <Text className="text-white text-center font-semibold">
              🧹 Clear Cache
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <LoadingOverlay visible={loading} message="Clearing cache..." />
    </ScrollView>
  );
}