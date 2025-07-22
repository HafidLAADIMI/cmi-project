import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface PaymentCardProps {
  total: number;
  onPress: () => void;
  loading?: boolean;
  delay?: number;
}

export function PaymentCard({ total, onPress, loading = false, delay = 0 }: PaymentCardProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay)}
      className="bg-gradient-to-br from-cmi-600 to-cmi-700 rounded-3xl p-8 shadow-cmi"
    >
      {/* Zone Logo CMI */}
      <View className="flex-row items-center justify-between mb-6">
        <View>
          <Text className="text-white/80 text-sm font-medium">Paiement Sécurisé via</Text>
          <Text className="text-white text-2xl font-bold">Passerelle CMI</Text>
        </View>
        <View className="bg-white/20 rounded-2xl p-3">
          <Text className="text-3xl">🏦</Text>
        </View>
      </View>

      {/* Affichage du Montant */}
      <View className="bg-white/10 rounded-2xl p-6 mb-6 backdrop-blur-sm">
        <Text className="text-white/80 text-sm font-medium mb-2">Montant Total</Text>
        <Text className="text-white text-4xl font-bold">
          {total.toFixed(2)} <Text className="text-2xl">DH</Text>
        </Text>
      </View>

      {/* Fonctionnalités de Sécurité
      <View className="flex-row justify-between mb-6">
        <View className="items-center">
          <Text className="text-2xl mb-1">🔒</Text>
          <Text className="text-white/80 text-xs">3D Secure</Text>
        </View>
        <View className="items-center">
          <Text className="text-2xl mb-1">🛡️</Text>
          <Text className="text-white/80 text-xs">Protection SSL</Text>
        </View>
        <View className="items-center">
          <Text className="text-2xl mb-1">✅</Text>
          <Text className="text-white/80 text-xs">Conforme PCI</Text>
        </View>
      </View>
      */}

      {/* Bouton de Paiement */}
      <TouchableOpacity
        onPress={onPress}
        disabled={loading}
        className="bg-white py-4 px-8 rounded-2xl shadow-lg active:scale-95 disabled:opacity-50"
      >
        <View className="flex-row items-center justify-center">
          {loading ? (
            <>
              <View className="w-5 h-5 border-2 border-cmi-600 border-t-transparent rounded-full animate-spin mr-3" />
              <Text className="text-cmi-700 font-bold text-lg">Connexion à CMI...</Text>
            </>
          ) : (
            <>
              <Text className="text-2xl mr-3">💳</Text>
              <Text className="text-cmi-700 font-bold text-lg">
                Payer avec CMI
              </Text>
            </>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}