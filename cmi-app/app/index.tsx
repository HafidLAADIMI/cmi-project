// app/index.tsx - Simple & Clean Version
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Image } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { CONFIG } from '../constants/config';
import { printerService } from '../services/printerService';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { CustomAlert } from '../components/CustomAlert';
import { OrderDetailModal } from '../components/OrderDetailModal';
import { getOrders, Order, updateOrderStatus } from '../services/orderService';

interface RealFirebaseOrder {
  id: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  address: string;
  deliveryInstructions: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  total: number;
  subtotal: number;
  deliveryFee: number;
  tipAmount: number;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
    variations: any[];
    addons: any[];
    subtotal: number;
  }>;
  notes: string;
  date: Date;
  createdAt: any;
  updatedAt: any;
  restaurantId: string;
  cuisineName: string;
  orderType: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export default function HomeScreen() {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState<RealFirebaseOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<RealFirebaseOrder | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [alert, setAlert] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info' as const,
  });

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setAlert({
      visible: true,
      title,
      message,
      type
    });
  };

  const loadOrders = async () => {
    try {
      const allOrders = await getOrders();
      const pendingOrders = allOrders.filter(order => 
        order.status === 'pending' && order.paymentStatus === 'unpaid'
      );
      
      setOrders(pendingOrders);
      
      // Don't auto-select anymore - let user choose
      // if (pendingOrders.length > 0 && !selectedOrder) {
      //   setSelectedOrder(pendingOrders[0]);
      // }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des commandes:', error);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadOrders();
      if (CONFIG.FEATURES.HAPTIC_FEEDBACK) {
        await Haptics.selectionAsync();
      }
    } catch (error) {
      console.error('Erreur d\'actualisation:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCashPayment = async () => {
    if (!selectedOrder) {
      showAlert('Erreur ⚠️', 'Veuillez sélectionner une commande.', 'warning');
      return;
    }

    if (CONFIG.FEATURES.HAPTIC_FEEDBACK) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setLoading(true);
    
    try {
      // Mettre à jour le statut Firebase
      const updated = await updateOrderStatus(
        selectedOrder.userId, 
        selectedOrder.id, 
        'confirmed', 
        {
          paymentStatus: 'paid',
          paymentMethod: 'cash',
          paidAt: new Date(),
          cashPayment: true,
        }
      );

      if (!updated) {
        throw new Error('Échec de la mise à jour de la commande');
      }

      // Préparer les données du reçu
      const receiptData = {
        orderId: selectedOrder.id,
        items: selectedOrder.items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          // Add variations and addons
          variations: item.variations || item.selectedVariations || [],
          addons: item.addons || item.selectedAddons || []
        })),
        total: selectedOrder.total,
        paymentMethod: 'Espèces',
        timestamp: new Date(),
        customerInfo: {
          name: selectedOrder.customerName || selectedOrder.userEmail || 'Client',
          phone: selectedOrder.customerPhone || selectedOrder.phoneNumber || 'N/A', // Fixed: was email before!
          address: (() => {
            if (typeof selectedOrder.address === 'object' && selectedOrder.address) {
              return selectedOrder.address.address || selectedOrder.address.region || 'Adresse non disponible';
            }
            return selectedOrder.address || 'Adresse non disponible';
          })(),
          region: (() => {
            if (selectedOrder.region) return selectedOrder.region;
            if (typeof selectedOrder.address === 'object' && selectedOrder.address?.region) {
              return selectedOrder.address.region;
            }
            return 'Région non disponible';
          })()
        },
        storeInfo: {
          name: 'AFOOD RESTAURANT',
          address: 'Casablanca, Maroc',
          phone: '+212671117076',
        }
      };
      
      // Imprimer le reçu
      const printSuccess = await printerService.printReceipt(receiptData);
      
      if (CONFIG.FEATURES.HAPTIC_FEEDBACK) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      const successMessage = `Paiement encaissé avec succès !\n\n` +
        `💰 Montant : ${selectedOrder.total.toFixed(2)} DH\n` +
        `👤 Client : ${selectedOrder.customerName}\n` +
        `📦 Commande : #${selectedOrder.id.slice(-6)}\n\n` +
        `${printSuccess ? '✅ Reçu imprimé' : '⚠️ Impression échouée'}\n` +
        `Commande marquée comme payée.`;

      showAlert('Paiement Réussi ! 🎉', successMessage, 'success');

      // Recharger les commandes
      await loadOrders();
      
      // Clear selected order since it's now processed
      setSelectedOrder(null);
      
    } catch (error) {
      console.error('💥 Erreur paiement espèces:', error);
      
      if (CONFIG.FEATURES.HAPTIC_FEEDBACK) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      
      showAlert(
        'Erreur de Paiement ❌', 
        'Une erreur s\'est produite lors du traitement du paiement.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const selectOrder = (order: RealFirebaseOrder) => {
    console.log('🔍 Selected order:', order); // Debug log
    setSelectedOrder(order);
    setShowOrderModal(true);
    if (CONFIG.FEATURES.HAPTIC_FEEDBACK) {
      Haptics.selectionAsync();
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedOrder) {
      console.log('❌ No selected order for payment');
      return;
    }
    console.log('💰 Processing payment for order:', selectedOrder.id);
    setShowOrderModal(false);
    await handleCashPayment();
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
        {/* En-tête Simple */}
        <Animated.View 
          entering={FadeInDown.delay(100)}
          className="bg-white dark:bg-gray-800 rounded-3xl p-6 mb-6"
          style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 }}
        >
          <View className="flex-row items-center justify-center mb-2">
            <Image 
              source={require('../assets/logo.png')} 
              style={{ width: 80, height: 80 }} 
              className="rounded-2xl mr-4"
            />
            <View className="flex-1">
              <Text className="text-3xl font-bold text-gray-900 dark:text-white text-center">
                AFOOD
              </Text>
              <Text className="text-gray-600 dark:text-gray-400 text-center mt-1">
                RESTAURANT
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Commandes en Attente */}
        {orders.length > 0 ? (
          <Animated.View 
            entering={FadeInDown.delay(200)}
            className="bg-white dark:bg-gray-800 rounded-3xl p-6 mb-6"
            style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 }}
          >
            <Text className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              📋 Commandes à Payer ({orders.length})
            </Text>
            
            {orders.map((order) => (
              <TouchableOpacity
                key={order.id}
                onPress={() => selectOrder(order)}
                className="p-4 rounded-2xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 mb-3"
              >
                <View className="flex-row justify-between items-start">
                  <View className="flex-1">
                    <Text className="font-bold text-gray-900 dark:text-white text-lg mb-2">
                      #{order.id.slice(-6)}
                    </Text>
                    
                    <Text className="text-gray-700 dark:text-gray-300 font-medium mb-1">
                      👤 {order.customerName}
                    </Text>
                    <Text className="text-gray-600 dark:text-gray-400 text-sm mb-1">
                      📞 {order.customerPhone}
                    </Text>
                    <Text className="text-gray-500 dark:text-gray-400 text-sm">
                      📦 {order.items.length} articles
                    </Text>
                  </View>
                  
                  <View className="items-end">
                    <Text className="text-2xl font-bold text-blue-600 mb-1">
                      {order.total.toFixed(2)} DH
                    </Text>
                    <View className="bg-blue-100 rounded-full px-2 py-1">
                      <Text className="text-blue-600 text-xs font-bold">VOIR DÉTAILS</Text>
                    </View>
                  </View>
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
                Aucune Commande en Attente
              </Text>
            </View>
            <Text className="text-yellow-700 dark:text-yellow-300 text-sm">
              Toutes les commandes ont été traitées.
            </Text>
          </Animated.View>
        )}

        {/* Remove the payment button section since payment is now in modal */}
      </View>
       
      <OrderDetailModal
        isVisible={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        onConfirmPayment={handleConfirmPayment}
        order={selectedOrder}
        loading={loading}
      />
      
      <LoadingOverlay 
        visible={loading} 
        message="Traitement du paiement..." 
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