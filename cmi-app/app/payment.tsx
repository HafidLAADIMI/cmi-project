import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, BackHandler, useColorScheme } from 'react-native';
import { WebView } from 'react-native-webview';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { apiService } from '../services/api';
import { printerService } from '../services/printerService';
import { updateOrderStatus } from '../services/orderService'; // Importation des fonctions Firebase
import { LoadingOverlay } from '../components/LoadingOverlay';
import { CustomAlert } from '../components/CustomAlert';
import { CONFIG } from '../constants/config';

interface PaymentParams {
  paymentUrl: string;
  orderId: string;
  firebaseOrderId?: string; // ID de commande Firebase
  firebaseUserId?: string; // ID utilisateur Firebase
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
      console.log('🖨️ === IMPRESSION REÇU DÉBUT ===');
      
      const receiptData = {
        orderId: orderData.id,
        items: CONFIG.MOCK_ORDER_ITEMS, // Vous pouvez utiliser les articles de commande réels ici
        total: orderData.total,
        paymentMethod: 'Carte de Crédit CMI',
        timestamp: new Date(),
        customerInfo: {
          name: params.customerName || 'Invité',
          email: params.customerEmail || '',
        },
        storeInfo: {
          name: 'Magasin Démo Paiement CMI',
          address: 'Adresse Démo, Istanbul, Turquie',
          phone: '+90 XXX XXX XX XX',
          taxId: 'DEMO123456789',
        }
      };

      console.log('🖨️ Impression du reçu pour la commande:', orderData.id);
      const printSuccess = await printerService.printReceipt(receiptData);
      
      if (printSuccess) {
        setPrintingStatus('success');
        console.log('✅ Reçu imprimé avec succès!');
        
        // Enregistrer dans le backend
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
            console.log('📝 Travail d\'impression enregistré avec succès dans le backend');
          } else {
            console.warn('⚠️ Échec de l\'enregistrement d\'impression dans le backend:', response.status);
          }
        } catch (logError) {
          console.warn('⚠️ Échec de l\'enregistrement du travail d\'impression:', logError);
        }
        
        return true;
      } else {
        setPrintingStatus('failed');
        console.error('❌ Échec de l\'impression du reçu');
        return false;
      }
    } catch (error) {
      setPrintingStatus('failed');
      console.error('🖨️ Erreur d\'impression:', error);
      return false;
    }
  };

  const updateFirebaseOrder = async (success: boolean) => {
    if (!params.firebaseOrderId || !params.firebaseUserId) {
      console.log('⚠️ Pas de données de commande Firebase, saut de la mise à jour');
      return;
    }

    try {
      console.log('🔥 Mise à jour du statut de commande Firebase...');
      const newStatus = success ? 'confirmed' : 'cancelled';
      const paymentStatus = success ? 'paid' : 'failed';
      
      const updateData = {
        paymentStatus,
        paidAt: success ? new Date() : null,
        cmiOrderId: params.orderId, // Lier l'ID de commande CMI
      };

      const updated = await updateOrderStatus(
        params.firebaseUserId, 
        params.firebaseOrderId, 
        newStatus, 
        updateData
      );

      if (updated) {
        console.log(`✅ Commande Firebase mise à jour vers ${newStatus}`);
      } else {
        console.error('❌ Échec de la mise à jour de la commande Firebase');
      }
    } catch (error) {
      console.error('🔥 Erreur de mise à jour Firebase:', error);
    }
  };

  const handlePaymentSuccess = async () => {
    console.log('🎉 === GESTIONNAIRE DE SUCCÈS DE PAIEMENT ===');
    setLoading(true);
    setWebViewVisible(false);
    
    if (CONFIG.FEATURES.HAPTIC_FEEDBACK) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    try {
      console.log('📊 Vérification du statut de la commande...');
      const response = await apiService.getOrderStatus(params.orderId);
      
      if (response.success && response.order) {
        console.log('✅ Commande confirmée:', response.order.status);
        
        if (response.order.status === 'paid') {
          // Mettre à jour le statut de commande Firebase
          await updateFirebaseOrder(true);
          
          // Imprimer le reçu
          const printSuccess = await printReceipt(response.order);
          
          // Afficher le résultat final
          const finalMessage = `Cher(ère) ${params.customerName || 'Client'},\n\n` +
            `Votre paiement de ${response.order.total.toFixed(2)} DH a été traité avec succès !\n\n` +
            `${printSuccess 
              ? '✅ Reçu imprimé avec succès !\nVeuillez récupérer votre reçu depuis l\'imprimante.' 
              : '⚠️ Paiement réussi mais l\'impression du reçu a échoué.\nVeuillez contacter le personnel pour un reçu manuel.'
            }\n\n` +
            `ID de Transaction : ${response.order.id.slice(-8)}\n` +
            `${params.customerEmail ? `Confirmation envoyée à : ${params.customerEmail}` : ''}\n\n` +
            `${params.firebaseOrderId ? `Commande #${params.firebaseOrderId.slice(-6)} mise à jour` : ''}`;

          showAlert(
            printSuccess ? 'Paiement et Impression Terminés ! 🎉' : 'Paiement Réussi ! ⚠️',
            finalMessage,
            printSuccess ? 'success' : 'warning'
          );
        } else {
          showAlert(
            'Statut de Paiement Inconnu ⚠️',
            `Le statut de la commande est : ${response.order.status}. Veuillez contacter le support pour obtenir de l'aide.`,
            'warning'
          );
        }
      } else {
        console.warn('⚠️ Commande introuvable ou réponse invalide');
        showAlert(
          'Commande Introuvable ⚠️',
          'Le paiement peut avoir réussi mais nous ne pouvons pas vérifier le statut. Veuillez contacter le support.',
          'warning'
        );
      }
    } catch (error) {
      console.error('💥 Erreur lors du traitement du succès du paiement:', error);
      showAlert(
        'Erreur de Traitement ⚠️',
        'Le paiement a réussi mais il y a eu une erreur lors du traitement. Veuillez contacter le support avec votre ID de commande.',
        'warning'
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentFailure = async () => {
    console.log('❌ Gestionnaire d\'échec de paiement');
    setWebViewVisible(false);
    
    if (CONFIG.FEATURES.HAPTIC_FEEDBACK) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    // Mettre à jour la commande Firebase vers annulée
    await updateFirebaseOrder(false);
    
    showAlert(
      'Paiement Échoué ❌',
      'Votre paiement n\'a pas pu être traité. Aucun frais n\'a été appliqué.\n\nVeuillez réessayer ou contacter le support si le problème persiste.',
      'error'
    );
  };

  // Gestion améliorée de la navigation WebView
  const handleNavigationStateChange = useCallback((navState: any) => {
    const { url, loading } = navState;
    console.log(`🌐 Navigation WebView : ${url} chargement : ${loading}`);

    // Ne pas traiter pendant le chargement
    if (loading) return;

    // Vérifier le succès/échec basé sur le hash (PLUS D'AVERTISSEMENTS DE LIEN PROFOND !)
    if (url.includes('#success-')) {
      console.log('✅ Succès de paiement détecté');
      handlePaymentSuccess();
      return;
    }
    
    if (url.includes('#fail-')) {
      console.log('❌ Échec de paiement détecté');
      handlePaymentFailure();
      return;
    }
  }, [params.orderId]);

  const handleShouldStartLoadWithRequest = useCallback((request: any) => {
    const { url } = request;
    console.log('🔗 WebView veut charger :', url);
    
    // Gérer les liens profonds
    if (url.startsWith('cmipaymentapp://')) {
      console.log('🔗 Interception du lien profond :', url);
      
      // Traiter le lien profond directement
      if (url.includes('payment/success')) {
        console.log('✅ Lien profond de succès intercepté');
        setTimeout(() => handlePaymentSuccess(), 100);
      } else if (url.includes('payment/fail')) {
        console.log('❌ Lien profond d\'échec intercepté');
        setTimeout(() => handlePaymentFailure(), 100);
      }
      
      return false; // Ne pas charger dans WebView
    }
    
    return true; // Autoriser la navigation normale
  }, []);

  const handleGoBack = useCallback(() => {
    setWebViewVisible(false);
    if (CONFIG.FEATURES.HAPTIC_FEEDBACK) {
      Haptics.selectionAsync();
    }
    showAlert(
      'Paiement Annulé ⏹️',
      'Paiement annulé par l\'utilisateur. Aucun frais n\'a été appliqué.',
      'warning'
    );
  }, [showAlert]);

  const handleAlertClose = useCallback(() => {
    setAlert(prev => ({ ...prev, visible: false }));
    setTimeout(() => router.back(), 300);
  }, []);

  // Gestion du bouton de retour Android
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

  // Valider les paramètres
  if (!params.paymentUrl || !params.orderId) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-900 p-6">
        <Animated.View entering={FadeIn} className="items-center">
          <Text className="text-red-600 text-xl font-bold mb-4">Paramètres de Paiement Invalides</Text>
          <Text className="text-gray-600 text-center mb-6">
            L'URL de paiement ou l'ID de commande est manquant. Veuillez réessayer depuis l'écran d'accueil.
          </Text>
          <TouchableOpacity onPress={() => router.back()} className="bg-primary-600 py-3 px-6 rounded-xl">
            <Text className="text-white font-bold">← Retour</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  const getLoadingMessage = () => {
    switch (printingStatus) {
      case 'printing': return 'Impression de votre reçu...';
      default: return 'Traitement de votre paiement...';
    }
  };

  return (
    <View className="flex-1 bg-white dark:bg-gray-900">
      {/* En-tête */}
      <Animated.View 
        entering={SlideInUp.duration(400)}
        className="bg-gradient-to-r from-cmi-600 to-cmi-700 px-6 pt-14 pb-6 shadow-cmi"
      >
        <View className="flex-row justify-between items-center">
          <View className="flex-1">
            <Text className="text-white text-lg font-bold">Paiement Sécurisé CMI</Text>
            <Text className="text-cmi-100 text-sm">
              Commande : {params.orderId.slice(-8)} • {params.customerName || 'Invité'}
              {params.firebaseOrderId && (
                <Text className="text-cmi-200"> : #{params.firebaseOrderId.slice(-6)}</Text>
              )}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleGoBack}
            disabled={loading}
            className="bg-white/20 py-3 px-4 rounded-xl disabled:opacity-50 active:scale-95"
          >
            <Text className="text-white font-bold">Annuler</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Affichage du Montant et du Statut */}
      <Animated.View 
        entering={FadeIn.delay(200)}
        className="bg-gray-50 dark:bg-gray-800 p-6 border-b border-gray-200 dark:border-gray-600"
      >
        <Text className="text-center text-4xl font-bold text-gray-900 dark:text-white mb-2">
          {parseFloat(params.orderTotal).toFixed(2)} <Text className="text-cmi-600">DH</Text>
        </Text>
        
        {/* Statut d'Intégration Firebase 
        {params.firebaseOrderId && (
          <View className="flex-row items-center justify-center mt-2 p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
            <Text className="text-green-600 dark:text-green-400 text-sm font-medium">
              🔥 Commande Firebase : #{params.firebaseOrderId.slice(-6)}
            </Text>
          </View>
        )}
          */}
        
        {/* Statut d'Impression */}
        {printingStatus !== 'idle' && (
          <View className="flex-row items-center justify-center mt-4 p-3 bg-white dark:bg-gray-700 rounded-xl">
            <View className={`w-3 h-3 rounded-full mr-3 ${
              printingStatus === 'printing' ? 'bg-yellow-500 animate-pulse' :
              printingStatus === 'success' ? 'bg-green-500' :
              'bg-red-500'
            }`} />
            <Text className="text-gray-800 dark:text-gray-200 font-medium">
              {printingStatus === 'printing' ? '🖨️ Impression du reçu...' :
               printingStatus === 'success' ? '✅ Reçu imprimé avec succès' :
               '❌ Échec de l\'impression du reçu'}
            </Text>
          </View>
        )}

        {/* Indicateurs de Sécurité 
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
            <Text className="text-blue-600 dark:text-blue-400 text-xs font-medium">Protection SSL</Text>
          </View>
          <View className="items-center">
            <View className="bg-purple-100 dark:bg-purple-900/30 rounded-full p-2 mb-1">
              <Text className="text-lg">✅</Text>
            </View>
            <Text className="text-purple-600 dark:text-purple-400 text-xs font-medium">Conforme PCI</Text>
          </View>
        </View>
        */}
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
                  <Text className="text-gray-700 font-medium">Chargement de la passerelle de paiement...</Text>
                </View>
              </View>
            )}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('❌ Erreur WebView:', nativeEvent);
              showAlert(
                'Erreur de Connexion 🌐',
                `Échec du chargement de la page de paiement.\n\nErreur : ${nativeEvent.description}\n\nVeuillez vérifier votre connexion internet et réessayer.`,
                'error'
              );
            }}
            onHttpError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('❌ Erreur HTTP WebView:', nativeEvent);
              showAlert(
                'Erreur de Passerelle de Paiement ⚠️',
                `Erreur du service de paiement (HTTP ${nativeEvent.statusCode}).\n\nVeuillez réessayer dans quelques instants.`,
                'error'
              );
            }}
            // Paramètres WebView améliorés
            javaScriptEnabled={true}
            domStorageEnabled={true}
            allowsInlineMediaPlaybook={true}
            mediaPlaybackRequiresUserAction={false}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            bounces={false}
            style={{ flex: 1 }}
          />
          
          {/* Informations de Débogage (Développement Uniquement) 
          {__DEV__ && (
            <View className="bg-gray-100 dark:bg-gray-800 p-2 border-t border-gray-200 dark:border-gray-700">
              <Text className="text-xs text-gray-600 dark:text-gray-400 text-center">
                🔗 Schéma de lien profond : {CONFIG.DEEP_LINK_SCHEME} | 🔥 Firebase : {params.firebaseOrderId?.slice(-6) || 'Aucun'}
              </Text>
            </View>
          )}
          */}
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
        confirmText={alert.type === 'success' ? 'Continuer les Achats' : 'OK'}
      />
    </View>
  );
}