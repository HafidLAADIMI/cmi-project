// app/(tabs)/analytics.tsx - Real Analytics with Firebase Data
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { apiService } from '../../services/api';
import { getPendingOrders, getAllOrders, FirebaseOrder } from '../../services/orderService';
import { LoadingOverlay } from '../../components/LoadingOverlay';

interface AnalyticsData {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  todayOrders: number;
  todayRevenue: number;
  recentOrders: FirebaseOrder[];
  topItems: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
}

export default function AnalyticsScreen() {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    todayOrders: 0,
    todayRevenue: 0,
    recentOrders: [],
    topItems: []
  });

  // Calculate analytics from Firebase orders
  const calculateAnalytics = async () => {
    try {
      console.log('📊 Calculating analytics...');
      
      // Get all orders from Firebase
      const allOrders = await getAllOrders();
      const pendingOrders = await getPendingOrders();
      
      // Get today's date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Calculate basic stats
      const totalOrders = allOrders.length;
      const pendingCount = pendingOrders.length;
      const completedOrders = allOrders.filter(order => 
        order.status === 'completed' || order.status === 'delivered'
      );
      const completedCount = completedOrders.length;
      
      // Calculate revenue (only from completed orders)
      const totalRevenue = completedOrders.reduce((sum, order) => sum + order.total, 0);
      const averageOrderValue = completedCount > 0 ? totalRevenue / completedCount : 0;
      
      // Today's stats
      const todayOrders = allOrders.filter(order => {
        const orderDate = new Date(order.createdAt);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === today.getTime();
      });
      const todayRevenue = todayOrders
        .filter(order => order.status === 'completed' || order.status === 'delivered')
        .reduce((sum, order) => sum + order.total, 0);
      
      // Recent orders (last 5)
      const recentOrders = allOrders
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
      
      // Top selling items
      const itemMap = new Map();
      allOrders.forEach(order => {
        order.items.forEach(item => {
          const key = item.name;
          if (itemMap.has(key)) {
            const existing = itemMap.get(key);
            itemMap.set(key, {
              name: item.name,
              quantity: existing.quantity + item.quantity,
              revenue: existing.revenue + (item.price * item.quantity)
            });
          } else {
            itemMap.set(key, {
              name: item.name,
              quantity: item.quantity,
              revenue: item.price * item.quantity
            });
          }
        });
      });
      
      const topItems = Array.from(itemMap.values())
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);
      
      setAnalytics({
        totalOrders,
        pendingOrders: pendingCount,
        completedOrders: completedCount,
        totalRevenue,
        averageOrderValue,
        todayOrders: todayOrders.length,
        todayRevenue,
        recentOrders,
        topItems
      });
      
      console.log('✅ Analytics calculated successfully');
    } catch (error) {
      console.error('❌ Error calculating analytics:', error);
    }
  };

  // Load analytics on screen load
  useEffect(() => {
    calculateAnalytics();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        apiService.checkHealth(),
        calculateAnalytics()
      ]);
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const clearCache = async () => {
    setLoading(true);
    try {
      await apiService.clearCache();
      // Recalculate analytics after clearing cache
      await calculateAnalytics();
    } catch (error) {
      console.error('Clear cache error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600';
      case 'completed': 
      case 'delivered': return 'text-green-600';
      case 'cancelled': return 'text-red-600';
      default: return 'text-gray-600';
    }
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
            📊 Real Analytics
          </Text>
          <Text className="text-gray-600 dark:text-gray-300">
            Live data from Firebase & CMI payments
          </Text>
        </Animated.View>

        {/* Overview Stats Grid */}
        <View className="flex-row flex-wrap justify-between mb-6">
          <Animated.View
            entering={FadeInDown.delay(200)}
            className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-4 w-[48%]"
          >
            <Text className="text-3xl mb-2">📦</Text>
            <Text className="text-gray-600 dark:text-gray-300 text-sm">Total Orders</Text>
            <Text className="text-2xl font-bold text-gray-900 dark:text-white">
              {analytics.totalOrders}
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(250)}
            className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-4 w-[48%]"
          >
            <Text className="text-3xl mb-2">⏳</Text>
            <Text className="text-gray-600 dark:text-gray-300 text-sm">Pending</Text>
            <Text className="text-2xl font-bold text-yellow-600">
              {analytics.pendingOrders}
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(300)}
            className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-4 w-[48%]"
          >
            <Text className="text-3xl mb-2">✅</Text>
            <Text className="text-gray-600 dark:text-gray-300 text-sm">Completed</Text>
            <Text className="text-2xl font-bold text-green-600">
              {analytics.completedOrders}
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(350)}
            className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-4 w-[48%]"
          >
            <Text className="text-3xl mb-2">💰</Text>
            <Text className="text-gray-600 dark:text-gray-300 text-sm">Total Revenue</Text>
            <Text className="text-2xl font-bold text-gray-900 dark:text-white">
              {analytics.totalRevenue.toFixed(2)} ₺
            </Text>
          </Animated.View>
        </View>

        {/* Today's Stats */}
        <Animated.View
          entering={FadeInDown.delay(400)}
          className="bg-blue-600 rounded-2xl p-6 mb-6"
        >
          <Text className="text-white text-xl font-bold mb-4">📅 Today's Performance</Text>
          <View className="flex-row justify-between">
            <View>
              <Text className="text-blue-100 text-sm">Orders Today</Text>
              <Text className="text-white text-2xl font-bold">{analytics.todayOrders}</Text>
            </View>
            <View>
              <Text className="text-blue-100 text-sm">Revenue Today</Text>
              <Text className="text-white text-2xl font-bold">{analytics.todayRevenue.toFixed(2)} ₺</Text>
            </View>
            <View>
              <Text className="text-blue-100 text-sm">Avg Order Value</Text>
              <Text className="text-white text-2xl font-bold">{analytics.averageOrderValue.toFixed(2)} ₺</Text>
            </View>
          </View>
        </Animated.View>

        {/* Top Items */}
        {analytics.topItems.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(450)}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-6"
          >
            <Text className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              🏆 Top Selling Items
            </Text>
            {analytics.topItems.map((item, index) => (
              <View key={index} className="flex-row justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                <View className="flex-1">
                  <Text className="font-medium text-gray-900 dark:text-white">{item.name}</Text>
                  <Text className="text-sm text-gray-600 dark:text-gray-400">
                    {item.quantity} sold • {item.revenue.toFixed(2)} ₺ revenue
                  </Text>
                </View>
                <View className="bg-blue-100 dark:bg-blue-900/30 rounded-full px-3 py-1">
                  <Text className="text-blue-600 dark:text-blue-400 font-bold">#{index + 1}</Text>
                </View>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Recent Orders */}
        {analytics.recentOrders.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(500)}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-6"
          >
            <Text className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              🕒 Recent Orders
            </Text>
            {analytics.recentOrders.map((order, index) => (
              <View key={order.id} className="flex-row justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                <View className="flex-1">
                  <Text className="font-medium text-gray-900 dark:text-white">
                    #{order.id.slice(-6)} - {order.customerName}
                  </Text>
                  <Text className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(order.createdAt).toLocaleDateString()} • {order.items.length} items
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="font-bold text-gray-900 dark:text-white">
                    {order.total.toFixed(2)} ₺
                  </Text>
                  <Text className={`text-sm font-medium ${getStatusColor(order.status)}`}>
                    {order.status}
                  </Text>
                </View>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Actions */}
        <Animated.View entering={FadeInDown.delay(600)} className="space-y-3">
          <TouchableOpacity
            onPress={onRefresh}
            className="bg-blue-600 py-4 px-6 rounded-xl"
          >
            <Text className="text-white text-center font-semibold">
              🔄 Refresh Analytics
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={clearCache}
            className="bg-gray-600 py-4 px-6 rounded-xl"
          >
            <Text className="text-white text-center font-semibold">
              🧹 Clear Cache & Refresh
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => console.log('Export feature coming soon!')}
            className="bg-green-600 py-4 px-6 rounded-xl"
          >
            <Text className="text-white text-center font-semibold">
              📊 Export Report (Coming Soon)
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <LoadingOverlay visible={loading} message="Updating analytics..." />
    </ScrollView>
  );
}