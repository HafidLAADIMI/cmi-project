// app/(tabs)/analytics.tsx - Complete Analytics with Real Firebase Data
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Dimensions } from 'react-native';
import Animated, { FadeInDown, FadeInLeft, FadeInRight } from 'react-native-reanimated';
import { apiService } from '../services/api';
import { getOrders, Order } from '../services/orderService';
import { LoadingOverlay } from '../components/LoadingOverlay';

const { width } = Dimensions.get('window');

interface RealAnalyticsData {
  // Order counts
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  progressOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  
  // Financial data
  totalRevenue: number;
  paidRevenue: number;
  unpaidRevenue: number;
  averageOrderValue: number;
  totalDeliveryFees: number;
  totalTips: number;
  
  // Today's performance
  todayOrders: number;
  todayRevenue: number;
  todayDeliveryFees: number;
  
  // Week's performance
  weekOrders: number;
  weekRevenue: number;
  
  // Lists and details
  recentOrders: any[];
  topItems: Array<{
    name: string;
    quantity: number;
    revenue: number;
    percentage: number;
  }>;
  cuisineStats: Array<{
    name: string;
    orders: number;
    revenue: number;
    percentage: number;
  }>;
  paymentMethodStats: Array<{
    method: string;
    count: number;
    revenue: number;
    percentage: number;
  }>;
  hourlyStats: Array<{
    hour: number;
    orders: number;
    revenue: number;
  }>;
}

export default function AnalyticsScreen() {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [analytics, setAnalytics] = useState<RealAnalyticsData>({
    totalOrders: 0,
    pendingOrders: 0,
    confirmedOrders: 0,
    progressOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
    paidRevenue: 0,
    unpaidRevenue: 0,
    averageOrderValue: 0,
    totalDeliveryFees: 0,
    totalTips: 0,
    todayOrders: 0,
    todayRevenue: 0,
    todayDeliveryFees: 0,
    weekOrders: 0,
    weekRevenue: 0,
    recentOrders: [],
    topItems: [],
    cuisineStats: [],
    paymentMethodStats: [],
    hourlyStats: []
  });

  // Calculate comprehensive analytics from Firebase orders
  const calculateAnalytics = async () => {
    try {
      console.log('📊 Calculating comprehensive analytics...');
      
      const allOrders = await getOrders();
      
      if (allOrders.length === 0) {
        console.log('No orders found');
        return;
      }

      // Date calculations
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Filter orders by period
      let filteredOrders = allOrders;
      switch (selectedPeriod) {
        case 'today':
          filteredOrders = allOrders.filter(order => {
            const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.date);
            return orderDate >= today;
          });
          break;
        case 'week':
          filteredOrders = allOrders.filter(order => {
            const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.date);
            return orderDate >= weekAgo;
          });
          break;
        case 'month':
          filteredOrders = allOrders.filter(order => {
            const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.date);
            return orderDate >= monthAgo;
          });
          break;
      }

      // Order status counts
      const totalOrders = filteredOrders.length;
      const pendingOrders = filteredOrders.filter(order => order.status === 'pending').length;
      const confirmedOrders = filteredOrders.filter(order => order.status === 'confirmed').length;
      const progressOrders = filteredOrders.filter(order => order.status === 'progress' || order.status === 'in-progress').length;
      const deliveredOrders = filteredOrders.filter(order => order.status === 'delivered' || order.status === 'completed').length;
      const cancelledOrders = filteredOrders.filter(order => order.status === 'cancelled').length;

      // Financial calculations
      const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0);
      const paidOrders = filteredOrders.filter(order => order.paymentStatus === 'paid');
      const paidRevenue = paidOrders.reduce((sum, order) => sum + (order.total || 0), 0);
      const unpaidRevenue = totalRevenue - paidRevenue;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      const totalDeliveryFees = filteredOrders.reduce((sum, order) => sum + (order.deliveryFee || 0), 0);
      const totalTips = filteredOrders.reduce((sum, order) => sum + (order.tipAmount || 0), 0);

      // Today's performance
      const todayOrders = allOrders.filter(order => {
        const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.date);
        return orderDate >= today;
      });
      const todayRevenue = todayOrders.reduce((sum, order) => sum + (order.total || 0), 0);
      const todayDeliveryFees = todayOrders.reduce((sum, order) => sum + (order.deliveryFee || 0), 0);

      // Week's performance
      const weekOrders = allOrders.filter(order => {
        const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.date);
        return orderDate >= weekAgo;
      });
      const weekRevenue = weekOrders.reduce((sum, order) => sum + (order.total || 0), 0);

      // Recent orders (last 10)
      const recentOrders = allOrders
        .sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.date);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.date);
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 10);

      // Top items analysis
      const itemMap = new Map();
      filteredOrders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach(item => {
            const key = item.name || 'Unknown Item';
            if (itemMap.has(key)) {
              const existing = itemMap.get(key);
              itemMap.set(key, {
                name: key,
                quantity: existing.quantity + (item.quantity || 1),
                revenue: existing.revenue + (item.subtotal || item.price * item.quantity || 0)
              });
            } else {
              itemMap.set(key, {
                name: key,
                quantity: item.quantity || 1,
                revenue: item.subtotal || item.price * item.quantity || 0
              });
            }
          });
        }
      });

      const totalItemQuantity = Array.from(itemMap.values()).reduce((sum, item) => sum + item.quantity, 0);
      const topItems = Array.from(itemMap.values())
        .map(item => ({
          ...item,
          percentage: totalItemQuantity > 0 ? (item.quantity / totalItemQuantity) * 100 : 0
        }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      // Cuisine/Restaurant stats
      const cuisineMap = new Map();
      filteredOrders.forEach(order => {
        const key = order.cuisineName || 'Unknown Cuisine';
        if (cuisineMap.has(key)) {
          const existing = cuisineMap.get(key);
          cuisineMap.set(key, {
            name: key,
            orders: existing.orders + 1,
            revenue: existing.revenue + (order.total || 0)
          });
        } else {
          cuisineMap.set(key, {
            name: key,
            orders: 1,
            revenue: order.total || 0
          });
        }
      });

      const cuisineStats = Array.from(cuisineMap.values())
        .map(cuisine => ({
          ...cuisine,
          percentage: totalOrders > 0 ? (cuisine.orders / totalOrders) * 100 : 0
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Payment method stats
      const paymentMap = new Map();
      filteredOrders.forEach(order => {
        const method = order.paymentMethod || 'cash_on_delivery';
        if (paymentMap.has(method)) {
          const existing = paymentMap.get(method);
          paymentMap.set(method, {
            method,
            count: existing.count + 1,
            revenue: existing.revenue + (order.total || 0)
          });
        } else {
          paymentMap.set(method, {
            method,
            count: 1,
            revenue: order.total || 0
          });
        }
      });

      const paymentMethodStats = Array.from(paymentMap.values())
        .map(payment => ({
          ...payment,
          percentage: totalOrders > 0 ? (payment.count / totalOrders) * 100 : 0
        }))
        .sort((a, b) => b.count - a.count);

      // Hourly distribution
      const hourlyMap = new Map();
      for (let i = 0; i < 24; i++) {
        hourlyMap.set(i, { hour: i, orders: 0, revenue: 0 });
      }

      filteredOrders.forEach(order => {
        const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.date);
        const hour = orderDate.getHours();
        const existing = hourlyMap.get(hour);
        hourlyMap.set(hour, {
          hour,
          orders: existing.orders + 1,
          revenue: existing.revenue + (order.total || 0)
        });
      });

      const hourlyStats = Array.from(hourlyMap.values())
        .filter(stat => stat.orders > 0)
        .sort((a, b) => b.orders - a.orders);

      setAnalytics({
        totalOrders,
        pendingOrders,
        confirmedOrders,
        progressOrders,
        deliveredOrders,
        cancelledOrders,
        totalRevenue,
        paidRevenue,
        unpaidRevenue,
        averageOrderValue,
        totalDeliveryFees,
        totalTips,
        todayOrders: todayOrders.length,
        todayRevenue,
        todayDeliveryFees,
        weekOrders: weekOrders.length,
        weekRevenue,
        recentOrders,
        topItems,
        cuisineStats,
        paymentMethodStats,
        hourlyStats
      });

      console.log('✅ Comprehensive analytics calculated successfully');
    } catch (error) {
      console.error('❌ Error calculating analytics:', error);
    }
  };

  useEffect(() => {
    calculateAnalytics();
  }, [selectedPeriod]);

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
      case 'confirmed': return 'text-blue-600';
      case 'progress':
      case 'in-progress': return 'text-purple-600';
      case 'delivered':
      case 'completed': return 'text-green-600';
      case 'cancelled': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'confirmed': return '✅';
      case 'progress':
      case 'in-progress': return '🚚';
      case 'delivered':
      case 'completed': return '📦';
      case 'cancelled': return '❌';
      default: return '❓';
    }
  };

  const formatOrderDate = (order: any) => {
    if (order.createdAt?.toDate) {
      return order.createdAt.toDate().toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    if (order.date) {
      return new Date(order.date).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return 'Date inconnue';
  };

  const formatPaymentMethod = (method: string) => {
    switch (method) {
      case 'cash_on_delivery': return 'Espèces à la livraison';
      case 'card': return 'Carte bancaire';
      case 'mobile_payment': return 'Paiement mobile';
      default: return method;
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
            📊 Analytiques en Temps Réel
          </Text>
          <Text className="text-gray-600 dark:text-gray-300">
            Données live depuis Firebase • {analytics.totalOrders} commandes total
          </Text>
        </Animated.View>

        {/* Period Selector */}
        <Animated.View
          entering={FadeInDown.delay(150)}
          className="flex-row mb-6 bg-white dark:bg-gray-800 rounded-2xl p-2"
        >
          {(['today', 'week', 'month', 'all'] as const).map((period) => (
            <TouchableOpacity
              key={period}
              onPress={() => setSelectedPeriod(period)}
              className={`flex-1 py-3 px-4 rounded-xl ${
                selectedPeriod === period
                  ? 'bg-blue-600'
                  : 'bg-transparent'
              }`}
            >
              <Text className={`text-center font-medium ${
                selectedPeriod === period
                  ? 'text-white'
                  : 'text-gray-600 dark:text-gray-300'
              }`}>
                {period === 'today' && "Aujourd'hui"}
                {period === 'week' && 'Cette semaine'}
                {period === 'month' && 'Ce mois'}
                {period === 'all' && 'Tout'}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Quick Stats Overview */}
        <Animated.View
          entering={FadeInDown.delay(200)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 mb-6"
        >
          <Text className="text-white text-xl font-bold mb-4">📈 Performance Globale</Text>
          <View className="flex-row justify-between">
            <View className="items-center">
              <Text className="text-white text-2xl font-bold">{analytics.totalOrders}</Text>
              <Text className="text-blue-100 text-sm">Commandes</Text>
            </View>
            <View className="items-center">
              <Text className="text-white text-2xl font-bold">{analytics.totalRevenue.toFixed(0)} ₺</Text>
              <Text className="text-blue-100 text-sm">Chiffre d'affaires</Text>
            </View>
            <View className="items-center">
              <Text className="text-white text-2xl font-bold">{analytics.averageOrderValue.toFixed(0)} ₺</Text>
              <Text className="text-blue-100 text-sm">Panier moyen</Text>
            </View>
          </View>
        </Animated.View>

        {/* Order Status Grid */}
        <View className="flex-row flex-wrap justify-between mb-6">
          {[
            { key: 'pending', count: analytics.pendingOrders, label: 'En attente', color: 'yellow' },
            { key: 'confirmed', count: analytics.confirmedOrders, label: 'Confirmées', color: 'blue' },
            { key: 'progress', count: analytics.progressOrders, label: 'En cours', color: 'purple' },
            { key: 'delivered', count: analytics.deliveredOrders, label: 'Livrées', color: 'green' },
            { key: 'cancelled', count: analytics.cancelledOrders, label: 'Annulées', color: 'red' },
          ].map((stat, index) => (
            <Animated.View
              key={stat.key}
              entering={FadeInDown.delay(250 + index * 50)}
              className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-4"
              style={{ width: (width - 48 - 12) / 2 }}
            >
              <Text className="text-3xl mb-2">{getStatusIcon(stat.key)}</Text>
              <Text className="text-gray-600 dark:text-gray-300 text-sm">{stat.label}</Text>
              <Text className={`text-2xl font-bold text-${stat.color}-600`}>
                {stat.count}
              </Text>
              {analytics.totalOrders > 0 && (
                <Text className="text-xs text-gray-500 mt-1">
                  {((stat.count / analytics.totalOrders) * 100).toFixed(1)}%
                </Text>
              )}
            </Animated.View>
          ))}
        </View>

        {/* Today vs Week Performance */}
        <View className="flex-row space-x-4 mb-6">
          <Animated.View
            entering={FadeInLeft.delay(400)}
            className="flex-1 bg-green-50 dark:bg-green-900/20 rounded-2xl p-4"
          >
            <Text className="text-green-600 dark:text-green-400 text-lg font-bold mb-2">
              📅 Aujourd'hui
            </Text>
            <Text className="text-green-900 dark:text-green-100 text-2xl font-bold">
              {analytics.todayOrders}
            </Text>
            <Text className="text-green-700 dark:text-green-300 text-sm">commandes</Text>
            <Text className="text-green-900 dark:text-green-100 text-lg font-semibold mt-2">
              {analytics.todayRevenue.toFixed(0)} ₺
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInRight.delay(450)}
            className="flex-1 bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4"
          >
            <Text className="text-blue-600 dark:text-blue-400 text-lg font-bold mb-2">
              📊 Cette semaine
            </Text>
            <Text className="text-blue-900 dark:text-blue-100 text-2xl font-bold">
              {analytics.weekOrders}
            </Text>
            <Text className="text-blue-700 dark:text-blue-300 text-sm">commandes</Text>
            <Text className="text-blue-900 dark:text-blue-100 text-lg font-semibold mt-2">
              {analytics.weekRevenue.toFixed(0)} ₺
            </Text>
          </Animated.View>
        </View>

        {/* Financial Breakdown */}
        <Animated.View
          entering={FadeInDown.delay(500)}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-6"
        >
          <Text className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            💰 Détail Financier
          </Text>
          <View className="space-y-3">
            <View className="flex-row justify-between">
              <Text className="text-gray-600 dark:text-gray-300">CA Total</Text>
              <Text className="font-bold text-gray-900 dark:text-white">
                {analytics.totalRevenue.toFixed(2)} ₺
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-600 dark:text-gray-300">CA Payé</Text>
              <Text className="font-bold text-green-600">
                {analytics.paidRevenue.toFixed(2)} ₺
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-600 dark:text-gray-300">CA Impayé</Text>
              <Text className="font-bold text-red-600">
                {analytics.unpaidRevenue.toFixed(2)} ₺
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-600 dark:text-gray-300">Frais de livraison</Text>
              <Text className="font-bold text-blue-600">
                {analytics.totalDeliveryFees.toFixed(2)} ₺
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-600 dark:text-gray-300">Pourboires</Text>
              <Text className="font-bold text-purple-600">
                {analytics.totalTips.toFixed(2)} ₺
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Top Items */}
        {analytics.topItems.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(550)}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-6"
          >
            <Text className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              🏆 Articles les Plus Vendus
            </Text>
            {analytics.topItems.map((item, index) => (
              <View key={index} className="flex-row justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                <View className="flex-1">
                  <Text className="font-medium text-gray-900 dark:text-white">{item.name}</Text>
                  <Text className="text-sm text-gray-600 dark:text-gray-400">
                    {item.quantity} vendus • {item.revenue.toFixed(0)} ₺ CA • {item.percentage.toFixed(1)}%
                  </Text>
                </View>
                <View className="bg-blue-100 dark:bg-blue-900/30 rounded-full px-3 py-1">
                  <Text className="text-blue-600 dark:text-blue-400 font-bold">#{index + 1}</Text>
                </View>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Cuisine Stats */}
        {analytics.cuisineStats.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(600)}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-6"
          >
            <Text className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              🍽️ Statistiques par Cuisine
            </Text>
            {analytics.cuisineStats.map((cuisine, index) => (
              <View key={index} className="flex-row justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                <View className="flex-1">
                  <Text className="font-medium text-gray-900 dark:text-white">{cuisine.name}</Text>
                  <Text className="text-sm text-gray-600 dark:text-gray-400">
                    {cuisine.orders} commandes • {cuisine.percentage.toFixed(1)}% du total
                  </Text>
                </View>
                <Text className="font-bold text-gray-900 dark:text-white">
                  {cuisine.revenue.toFixed(0)} ₺
                </Text>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Payment Methods */}
        {analytics.paymentMethodStats.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(650)}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-6"
          >
            <Text className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              💳 Méthodes de Paiement
            </Text>
            {analytics.paymentMethodStats.map((payment, index) => (
              <View key={index} className="flex-row justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                <View className="flex-1">
                  <Text className="font-medium text-gray-900 dark:text-white">
                    {formatPaymentMethod(payment.method)}
                  </Text>
                  <Text className="text-sm text-gray-600 dark:text-gray-400">
                    {payment.count} commandes • {payment.percentage.toFixed(1)}%
                  </Text>
                </View>
                <Text className="font-bold text-gray-900 dark:text-white">
                  {payment.revenue.toFixed(0)} ₺
                </Text>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Recent Orders */}
        {analytics.recentOrders.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(700)}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-6"
          >
            <Text className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              🕒 Commandes Récentes
            </Text>
            {analytics.recentOrders.map((order, index) => (
              <View key={order.id} className="flex-row justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                <View className="flex-1">
                  <Text className="font-medium text-gray-900 dark:text-white">
                    #{order.id.slice(-6)} - {order.customerName || 'Client anonyme'}
                  </Text>
                  <Text className="text-sm text-gray-600 dark:text-gray-400">
                    {formatOrderDate(order)} • {order.items?.length || 0} articles
                  </Text>
                  {order.address && (
                    <Text className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      📍 {order.address.slice(0, 40)}...
                    </Text>
                  )}
                </View>
                <View className="items-end">
                  <Text className="font-bold text-gray-900 dark:text-white">
                    {order.total?.toFixed(2) || '0.00'} ₺
                  </Text>
                  <Text className={`text-sm font-medium ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)} {Order.getStatusDisplay(order.status)}
                  </Text>
                </View>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Hourly Distribution */}
        {analytics.hourlyStats.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(750)}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-6"
          >
            <Text className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              🕐 Distribution Horaire
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row space-x-3">
                {analytics.hourlyStats.slice(0, 10).map((stat, index) => (
                  <View key={stat.hour} className="items-center bg-gray-50 dark:bg-gray-700 rounded-xl p-3 min-w-[70px]">
                    <Text className="text-lg font-bold text-gray-900 dark:text-white">
                      {stat.orders}
                    </Text>
                    <Text className="text-xs text-gray-600 dark:text-gray-300">
                      {stat.hour}h
                    </Text>
                    <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {stat.revenue.toFixed(0)} ₺
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </Animated.View>
        )}

        {/* Performance Indicators */}
        <Animated.View
          entering={FadeInDown.delay(800)}
          className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-6 mb-6"
        >
          <Text className="text-white text-xl font-bold mb-4">📈 Indicateurs Clés</Text>
          <View className="space-y-3">
            <View className="flex-row justify-between">
              <Text className="text-green-100">Taux de livraison</Text>
              <Text className="text-white font-bold">
                {analytics.totalOrders > 0 
                  ? ((analytics.deliveredOrders / analytics.totalOrders) * 100).toFixed(1)
                  : '0'}%
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-green-100">Taux d'annulation</Text>
              <Text className="text-white font-bold">
                {analytics.totalOrders > 0 
                  ? ((analytics.cancelledOrders / analytics.totalOrders) * 100).toFixed(1)
                  : '0'}%
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-green-100">Taux de paiement</Text>
              <Text className="text-white font-bold">
                {analytics.totalRevenue > 0 
                  ? ((analytics.paidRevenue / analytics.totalRevenue) * 100).toFixed(1)
                  : '0'}%
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-green-100">Pourboire moyen</Text>
              <Text className="text-white font-bold">
                {analytics.totalOrders > 0 
                  ? (analytics.totalTips / analytics.totalOrders).toFixed(2)
                  : '0.00'} ₺
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Growth Metrics */}
        <Animated.View
          entering={FadeInDown.delay(850)}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-6"
        >
          <Text className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            📊 Métriques de Croissance
          </Text>
          <View className="grid grid-cols-2 gap-4">
            <View className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
              <Text className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                Commandes aujourd'hui vs hier
              </Text>
              <Text className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                +{analytics.todayOrders}
              </Text>
              <Text className="text-blue-700 dark:text-blue-300 text-xs">
                Tendance quotidienne
              </Text>
            </View>
            
            <View className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
              <Text className="text-green-600 dark:text-green-400 text-sm font-medium">
                CA moyen par commande
              </Text>
              <Text className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
                {analytics.averageOrderValue.toFixed(0)} ₺
              </Text>
              <Text className="text-green-700 dark:text-green-300 text-xs">
                Panier moyen global
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View entering={FadeInDown.delay(900)} className="space-y-3 mb-8">
          <TouchableOpacity
            onPress={onRefresh}
            className="bg-blue-600 py-4 px-6 rounded-xl flex-row items-center justify-center"
          >
            <Text className="text-white text-center font-semibold mr-2">
              🔄 Actualiser les Données
            </Text>
          </TouchableOpacity>
          
          <View className="flex-row space-x-3">
            <TouchableOpacity
              onPress={clearCache}
              className="flex-1 bg-gray-600 py-4 px-6 rounded-xl"
            >
              <Text className="text-white text-center font-semibold">
                🧹 Vider Cache
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => console.log('Export feature coming soon!')}
              className="flex-1 bg-green-600 py-4 px-6 rounded-xl"
            >
              <Text className="text-white text-center font-semibold">
                📊 Exporter
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => console.log('Detailed analytics coming soon!')}
            className="bg-purple-600 py-4 px-6 rounded-xl"
          >
            <Text className="text-white text-center font-semibold">
              📈 Analyse Détaillée (Bientôt)
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Data Summary Footer */}
        <Animated.View
          entering={FadeInDown.delay(950)}
          className="bg-gray-100 dark:bg-gray-800/50 rounded-2xl p-4 mb-6"
        >
          <Text className="text-center text-gray-600 dark:text-gray-400 text-sm">
            📊 Dernière mise à jour: {new Date().toLocaleTimeString('fr-FR')}
          </Text>
          <Text className="text-center text-gray-500 dark:text-gray-500 text-xs mt-1">
            Données en temps réel depuis Firebase • Période: {
              selectedPeriod === 'today' ? "Aujourd'hui" :
              selectedPeriod === 'week' ? 'Cette semaine' :
              selectedPeriod === 'month' ? 'Ce mois' : 'Toutes les données'
            }
          </Text>
          {analytics.totalOrders === 0 && (
            <Text className="text-center text-yellow-600 dark:text-yellow-400 text-sm mt-2">
              ⚠️ Aucune commande trouvée pour cette période
            </Text>
          )}
        </Animated.View>
      </View>

      <LoadingOverlay visible={loading} message="Mise à jour des analytiques..." />
    </ScrollView>
  );
}