import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  type?: 'default' | 'payment' | 'cmi';
}

export function LoadingOverlay({ 
  visible, 
  message = 'Loading...',
  type = 'default' 
}: LoadingOverlayProps) {
  if (!visible) return null;

  const getConfig = () => {
    switch (type) {
      case 'payment':
        return { color: '#3b82f6', icon: '💳', bg: 'bg-primary-50' };
      case 'cmi':
        return { color: '#dc2626', icon: '🏦', bg: 'bg-cmi-50' };
      default:
        return { color: '#6b7280', icon: '⏳', bg: 'bg-gray-50' };
    }
  };

  const config = getConfig();

  return (
    <Animated.View 
      entering={FadeIn.duration(300)} 
      exiting={FadeOut.duration(300)}
      className="absolute inset-0 bg-black/60 justify-center items-center z-50"
    >
      <View className={`${config.bg} p-8 rounded-3xl shadow-2xl items-center min-w-[250px] mx-6 border border-white/20`}>
        <View className="mb-6 relative">
          <ActivityIndicator size="large" color={config.color} />
          <Text className="absolute inset-0 text-center text-3xl mt-1">
            {config.icon}
          </Text>
        </View>
        
        <Text className="text-gray-800 dark:text-gray-200 text-center font-semibold text-lg">
          {message}
        </Text>
        
        {/* Animated dots */}
        <View className="flex-row mt-4 space-x-2">
          {[0, 1, 2].map((index) => (
            <View
              key={index}
              className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"
              style={{ animationDelay: `${index * 200}ms` }}
            />
          ))}
        </View>
      </View>
    </Animated.View>
  );
}