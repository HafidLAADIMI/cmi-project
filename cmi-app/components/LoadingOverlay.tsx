import React from 'react';
import { View, ActivityIndicator, Text, Modal } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export function LoadingOverlay({ 
  visible, 
  message = 'Chargement...'
}: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View 
        entering={FadeIn.duration(300)} 
        exiting={FadeOut.duration(200)}
        className="flex-1 bg-black/60 justify-center items-center"
      >
        <View className="bg-white dark:bg-gray-800 p-8 rounded-3xl items-center min-w-[250px] mx-6">
          <ActivityIndicator size="large" color="#3b82f6" />
          
          <Text className="text-gray-800 dark:text-gray-200 text-center font-semibold text-lg mt-4">
            {message}
          </Text>
        </View>
      </Animated.View>
    </Modal>
  );
}