// app/(tabs)/index.tsx - Version française avec logo AFOUD
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, TextInput, Image } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { CONFIG } from '../../constants/config';
import { apiService } from '../../services/api';
import { printerService } from '../../services/printerService';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { CustomAlert } from '../../components/CustomAlert';
import { PaymentCard } from '../../components/PaymentCard';
import { getOrders, Order, updateOrderStatus } from '../../services/orderService';

// Interface mise à jour pour correspondre au service de commandes réel
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
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [alert, setAlert] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info' as const,
  });

  // Charger les commandes en utilisant votre service réel
  const loadOrders = async () => {
    try {
      console.log('📊 Chargement des commandes depuis le service Firebase réel...');
      const allOrders = await getOrders();
      
      // Filtrer les commandes en attente qui nécessitent un paiement
      const pendingOrders = allOrders.filter(order => 
        order.status === 'pending' && order.paymentStatus === 'unpaid'
      );
      
      setOrders(pendingOrders);
      
      // Sélectionner automatiquement la première commande si aucune n'est sélectionnée
      if (pendingOrders.length > 0 && !selectedOrder) {
        const firstOrder = pendingOrders[0];
        setSelectedOrder(firstOrder);
        setCustomerName(firstOrder.customerName);
        setCustomerEmail(firstOrder.customerPhone);
      }
      
      console.log(`✅ Chargé ${pendingOrders.length} commandes en attente sur ${allOrders.length} au total`);
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
      await Promise.all([
        apiService.checkHealth(),
        loadOrders()
      ]);
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
      console.log('💵 === PAIEMENT EN ESPÈCES DÉBUT ===');
      console.log('Commande:', selectedOrder.id);
      console.log('Montant:', selectedOrder.total);
      
      // Mettre à jour le statut Firebase vers confirmé et payé
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

      console.log('✅ Statut de commande Firebase mis à jour');

      // Préparer les données du reçu
      const receiptData = {
        orderId: selectedOrder.id,
        items: selectedOrder.items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        total: selectedOrder.total,
        paymentMethod: 'Espèces',
        timestamp: new Date(),
        customerInfo: {
          name: selectedOrder.customerName,
          email: selectedOrder.customerPhone,
        },
        storeInfo: {
          name: 'AFOUD - Plateforme de Livraison',
          address: 'Marrakech, Maroc',
          phone: '+212 XXX XXX XXX',
          taxId: 'AFOUD123456789',
        }
      };

      console.log('🖨️ Impression du reçu...');
      
      // Imprimer le reçu
      const printSuccess = await printerService.printReceipt(receiptData);
      
      if (printSuccess) {
        console.log('✅ Reçu imprimé avec succès');
        
        if (CONFIG.FEATURES.HAPTIC_FEEDBACK) {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        const successMessage = `Paiement en espèces encaissé avec succès !\n\n` +
          `💰 Montant : ${selectedOrder.total.toFixed(2)} DH\n` +
          `👤 Client : ${selectedOrder.customerName}\n` +
          `📦 Commande : #${selectedOrder.id.slice(-6)}\n\n` +
          `✅ Reçu imprimé avec succès !\n` +
          `Veuillez remettre le reçu au client.\n\n` +
          `Commande marquée comme payée et confirmée.`;

        showAlert('Paiement Espèces Réussi ! 🎉', successMessage, 'success');

        // Recharger les commandes pour supprimer celle-ci de la liste
        await loadOrders();
        
      } else {
        console.warn('⚠️ Impression du reçu échouée');
        
        const warningMessage = `Paiement encaissé avec succès mais l'impression a échoué.\n\n` +
          `💰 Montant : ${selectedOrder.total.toFixed(2)} DH\n` +
          `👤 Client : ${selectedOrder.customerName}\n` +
          `📦 Commande : #${selectedOrder.id.slice(-6)}\n\n` +
          `⚠️ Veuillez imprimer un reçu manuel.\n` +
          `La commande est marquée comme payée.`;

        showAlert('Paiement Réussi - Problème d\'Impression ⚠️', warningMessage, 'warning');
        
        // Recharger les commandes même si l'impression a échoué
        await loadOrders();
      }
      
      console.log('✅ === PAIEMENT EN ESPÈCES TERMINÉ ===');
      
    } catch (error) {
      console.error('💥 Erreur paiement espèces:', error);
      
      if (CONFIG.FEATURES.HAPTIC_FEEDBACK) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      
      showAlert(
        'Erreur de Paiement ❌', 
        'Une erreur s\'est produite lors du traitement du paiement en espèces. Veuillez réessayer.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (CONFIG.FEATURES.HAPTIC_FEEDBACK) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setLoading(true);
    
    try {
      const isHealthy = await apiService.checkHealth();
      if (!isHealthy) {
        showAlert('Erreur de Connexion 🌐', 'Impossible de se connecter au serveur de paiement.', 'error');
        return;
      }

      // Utiliser les articles de commande réels avec la structure appropriée
      const orderItems = selectedOrder!.items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      }));

      const response = await apiService.initiateCmiPayment(orderItems, {
        name: customerName,
        email: customerEmail,
      });
      
      if (response.success && response.paymentUrl) {
        if (CONFIG.FEATURES.HAPTIC_FEEDBACK) {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

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
        showAlert('Erreur de Paiement 🏦', response.error || 'Échec de l\'initialisation du paiement.', 'error');
      }
    } catch (error) {
      console.error('Erreur de paiement:', error);
      showAlert('Erreur Inattendue ⚠️', 'Une erreur s\'est produite. Veuillez réessayer.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const selectOrder = (order: RealFirebaseOrder) => {
    setSelectedOrder(order);
    setCustomerName(order.customerName);
    setCustomerEmail(order.customerPhone);
  };

  const formatOrderDate = (orderData: any) => {
    if (orderData.createdAt?.toDate) {
      return orderData.createdAt.toDate().toLocaleDateString('fr-FR');
    }
    if (orderData.date) {
      return new Date(orderData.date).toLocaleDateString('fr-FR');
    }
    return new Date().toLocaleDateString('fr-FR');
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
        {/* En-tête avec Logo AFOUD */}
        <Animated.View 
          entering={FadeInDown.delay(100)}
          className="bg-white dark:bg-gray-800 rounded-3xl p-6 mb-6 shadow-sm"
        >
          <View className="flex-row items-center justify-center mb-2">
            <Image 
              source={require('../../assets/logo.jpg')} 
              style={{ width: 80, height: 80 }} 
              className="rounded-2xl mr-4"
            />
            <View className="flex-1">
              <Text className="text-3xl font-bold text-gray-900 dark:text-white text-center">
                AFOUD
              </Text>
              <Text className="text-gray-600 dark:text-gray-400 text-center mt-1">
                Plateforme de Paiement
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Sélection de Commande */}
        {orders.length > 0 ? (
          <Animated.View 
            entering={FadeInDown.delay(200)}
            className="bg-white dark:bg-gray-800 rounded-3xl p-6 mb-6"
          >
            <Text className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              📋 Sélectionner une Commande à Payer
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
                          <Text className="text-white text-xs font-bold">SÉLECTIONNÉE</Text>
                        </View>
                      )}
                    </View>
                    
                    <Text className="text-gray-700 dark:text-gray-300 font-medium mb-1">
                      👤 {order.customerName}
                    </Text>
                    <Text className="text-gray-600 dark:text-gray-400 text-sm mb-1">
                      📞 {order.customerPhone}
                    </Text>
                    <Text className="text-gray-600 dark:text-gray-400 text-sm mb-1">
                      📍 {order.address.length > 40 ? order.address.substring(0, 40) + '...' : order.address}
                    </Text>
                    {order.cuisineName && (
                      <Text className="text-gray-500 dark:text-gray-400 text-xs mb-1">
                        🍽️ {order.cuisineName}
                      </Text>
                    )}
                    <Text className="text-gray-500 dark:text-gray-400 text-sm">
                      📦 {order.items.length} articles • {Order.getStatusDisplay(order.status)}
                    </Text>
                  </View>
                  
                  <View className="items-end">
                    <Text className="text-2xl font-bold text-blue-600 mb-1">
                      {order.total.toFixed(2)} DH
                    </Text>
                    <Text className="text-xs text-gray-500 dark:text-gray-400">
                      {formatOrderDate(order)}
                    </Text>
                    {order.deliveryFee > 0 && (
                      <Text className="text-xs text-gray-500">
                        +{order.deliveryFee.toFixed(2)} DH livraison
                      </Text>
                    )}
                  </View>
                </View>
                
                {/* Aperçu des Articles de la Commande */}
                <View className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                  {order.items.slice(0, 2).map((item, index) => (
                    <View key={index} className="flex-row justify-between items-center">
                      <Text className="text-sm text-gray-600 dark:text-gray-400 flex-1">
                        • {item.quantity}x {item.name}
                        {item.variations.length > 0 && (
                          <Text className="text-xs text-gray-500">
                            {' '}({item.variations.map(v => v.name).join(', ')})
                          </Text>
                        )}
                      </Text>
                      <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-2">
                        {item.subtotal.toFixed(2)} DH
                      </Text>
                    </View>
                  ))}
                  {order.items.length > 2 && (
                    <Text className="text-sm text-gray-500 dark:text-gray-500">
                      ... et {order.items.length - 2} autres articles
                    </Text>
                  )}
                  {order.notes && (
                    <Text className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                      💬 {order.notes}
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
                Aucune Commande en Attente
              </Text>
            </View>
            <Text className="text-yellow-700 dark:text-yellow-300 text-sm">
              Aucune commande trouvée nécessitant un paiement. Les commandes apparaîtront ici lorsque les clients les passeront.
            </Text>
          </Animated.View>
        )}

        {/* Informations Client (commenté pour le moment)
        <Animated.View 
          entering={FadeInDown.delay(300)}
          className="bg-white dark:bg-gray-800 rounded-3xl p-6 mb-6"
        >
          <View className="flex-row items-center mb-4">
            <View className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-3 mr-4">
              <Text className="text-2xl">👤</Text>
            </View>
            <Text className="text-xl font-bold text-gray-900 dark:text-white">
              Informations Client
            </Text>
          </View>
          
          <View className="mb-4">
            <Text className="text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
              Nom du Client
            </Text>
            <TextInput
              value={customerName}
              onChangeText={setCustomerName}
              placeholder="Saisir le nom du client"
              className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white"
            />
          </View>
          
          <View>
            <Text className="text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
              Téléphone/Email
            </Text>
            <TextInput
              value={customerEmail}
              onChangeText={setCustomerEmail}
              placeholder="Saisir téléphone ou email"
              className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white"
            />
          </View>
        </Animated.View>
        */}

        {/* Options de Paiement */}
        <View className="mt-6 space-y-4">
          {/* Paiement par Carte CMI 
          <PaymentCard
            total={selectedOrder?.total || 0}
            onPress={handlePayment}
            loading={loading}
            delay={400}
          />

          */}
          
          {/* Paiement en Espèces */}
          <Animated.View
            entering={FadeInDown.delay(450)}
            className="bg-gradient-to-br from-green-600 to-green-700 rounded-3xl p-6 shadow-lg"
          >
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-white/80 text-sm font-medium">Paiement Direct</Text>
                <Text className="text-white text-xl font-bold">Espèces</Text>
              </View>
              <View className="bg-white/20 rounded-2xl p-3">
                <Text className="text-3xl">💵</Text>
              </View>
            </View>

            <View className="bg-white/10 rounded-2xl p-4 mb-4 backdrop-blur-sm">
              <Text className="text-white/80 text-sm font-medium mb-2">Montant à Encaisser</Text>
              <Text className="text-white text-3xl font-bold">
                {selectedOrder?.total.toFixed(2) || '0.00'} <Text className="text-xl">DH</Text>
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleCashPayment}
              disabled={loading || !selectedOrder}
              className="bg-white py-4 px-6 rounded-2xl shadow-lg active:scale-95 disabled:opacity-50"
            >
              <View className="flex-row items-center justify-center">
                {loading ? (
                  <>
                    <View className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin mr-3" />
                    <Text className="text-green-700 font-bold text-lg">Impression en cours...</Text>
                  </>
                ) : (
                  <>
                    <Text className="text-2xl mr-3">🖨️</Text>
                    <Text className="text-green-700 font-bold text-lg">
                      Encaisser & Imprimer
                    </Text>
                  </>
                )}
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Fonctionnalités et Sécurité (commenté pour le moment)
        <Animated.View 
          entering={FadeInDown.delay(500)}
          className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-3xl p-6 mt-6"
        >
          <View className="flex-row items-center mb-4">
            <Text className="text-3xl mr-3">🛡️</Text>
            <Text className="text-blue-800 dark:text-blue-200 font-bold text-xl">
              Fonctionnalités de Sécurité
            </Text>
          </View>
          
          <View className="flex-row flex-wrap justify-between">
            <View className="items-center w-1/2 mb-4">
              <Text className="text-2xl mb-2">🔒</Text>
              <Text className="text-blue-700 dark:text-blue-300 text-sm font-medium text-center">
                Authentification 3D Secure
              </Text>
            </View>
            <View className="items-center w-1/2 mb-4">
              <Text className="text-2xl mb-2">🛡️</Text>
              <Text className="text-blue-700 dark:text-blue-300 text-sm font-medium text-center">
                Conforme PCI DSS
              </Text>
            </View>
            <View className="items-center w-1/2">
              <Text className="text-2xl mb-2">🔐</Text>
              <Text className="text-blue-700 dark:text-blue-300 text-sm font-medium text-center">
                Chiffrement SSL/TLS
              </Text>
            </View>
            <View className="items-center w-1/2">
              <Text className="text-2xl mb-2">✅</Text>
              <Text className="text-blue-700 dark:text-blue-300 text-sm font-medium text-center">
                Vérification en Temps Réel
              </Text>
            </View>
          </View>
        </Animated.View>
        */}
      </View>
       
      <LoadingOverlay 
        visible={loading} 
        message="Connexion à la Passerelle CMI..." 
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