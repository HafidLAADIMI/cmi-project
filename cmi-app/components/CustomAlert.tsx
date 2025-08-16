import React from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { CONFIG } from '../constants/config';

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  type?: 'info' | 'success' | 'error' | 'warning';
  confirmText?: string;
}

export function CustomAlert({
  visible,
  title,
  message,
  onClose,
  type = 'info',
  confirmText = 'OK'
}: CustomAlertProps) {
  
  React.useEffect(() => {
    if (visible && CONFIG.FEATURES.HAPTIC_FEEDBACK) {
      switch (type) {
        case 'success':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'error':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
        case 'warning':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        default:
          Haptics.selectionAsync();
      }
    }
  }, [visible, type]);

  const getAlertConfig = () => {
    switch (type) {
      case 'success':
        return { 
          bg: 'bg-green-50 dark:bg-green-900/20', 
          border: 'border-green-200 dark:border-green-700', 
          text: 'text-green-800 dark:text-green-200', 
          button: 'bg-green-600',
          icon: '✅'
        };
      case 'error':
        return { 
          bg: 'bg-red-50 dark:bg-red-900/20', 
          border: 'border-red-200 dark:border-red-700', 
          text: 'text-red-800 dark:text-red-200', 
          button: 'bg-red-600',
          icon: '❌'
        };
      case 'warning':
        return { 
          bg: 'bg-yellow-50 dark:bg-yellow-900/20', 
          border: 'border-yellow-200 dark:border-yellow-700', 
          text: 'text-yellow-800 dark:text-yellow-200', 
          button: 'bg-yellow-600',
          icon: '⚠️'
        };
      default:
        return { 
          bg: 'bg-blue-50 dark:bg-blue-900/20', 
          border: 'border-blue-200 dark:border-blue-700', 
          text: 'text-blue-800 dark:text-blue-200', 
          button: 'bg-blue-600',
          icon: 'ℹ️'
        };
    }
  };

  const config = getAlertConfig();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View 
        entering={FadeIn.duration(300)} 
        exiting={FadeOut.duration(200)}
        className="flex-1 bg-black/50 justify-center items-center p-6"
      >
        <Pressable className="absolute inset-0" onPress={onClose} />
        
        <View className={`${config.bg} ${config.border} border rounded-2xl p-6 w-full max-w-sm`}>
          {/* Simple Header */}
          <View className="items-center mb-4">
            <Text className="text-3xl mb-2">{config.icon}</Text>
            <Text className={`${config.text} text-xl font-bold text-center`}>
              {title}
            </Text>
          </View>

          {/* Message */}
          <Text className={`${config.text} text-sm mb-6 text-center leading-5`}>
            {message}
          </Text>

          {/* Simple Button */}
          <TouchableOpacity
            onPress={onClose}
            className={`${config.button} py-3 px-6 rounded-xl`}
          >
            <Text className="text-white text-center font-semibold">
              {confirmText}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}