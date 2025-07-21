import React from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import Animated, { SlideInDown, SlideOutDown, FadeIn, FadeOut } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { CONFIG } from '../constants/config';

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  type?: 'info' | 'success' | 'error' | 'warning' | 'cmi';
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
          button: 'bg-green-600 hover:bg-green-700 shadow-green-200',
          icon: '✅',
          gradient: 'from-green-500 to-green-600'
        };
      case 'error':
        return { 
          bg: 'bg-red-50 dark:bg-red-900/20', 
          border: 'border-red-200 dark:border-red-700', 
          text: 'text-red-800 dark:text-red-200', 
          button: 'bg-red-600 hover:bg-red-700 shadow-red-200',
          icon: '❌',
          gradient: 'from-red-500 to-red-600'
        };
      case 'warning':
        return { 
          bg: 'bg-yellow-50 dark:bg-yellow-900/20', 
          border: 'border-yellow-200 dark:border-yellow-700', 
          text: 'text-yellow-800 dark:text-yellow-200', 
          button: 'bg-yellow-600 hover:bg-yellow-700 shadow-yellow-200',
          icon: '⚠️',
          gradient: 'from-yellow-500 to-yellow-600'
        };
      case 'cmi':
        return { 
          bg: 'bg-cmi-50 dark:bg-cmi-900/20', 
          border: 'border-cmi-200 dark:border-cmi-700', 
          text: 'text-cmi-800 dark:text-cmi-200', 
          button: 'bg-cmi-600 hover:bg-cmi-700 shadow-cmi',
          icon: '🏦',
          gradient: 'from-cmi-500 to-cmi-600'
        };
      default:
        return { 
          bg: 'bg-blue-50 dark:bg-blue-900/20', 
          border: 'border-blue-200 dark:border-blue-700', 
          text: 'text-blue-800 dark:text-blue-200', 
          button: 'bg-blue-600 hover:bg-blue-700 shadow-primary',
          icon: 'ℹ️',
          gradient: 'from-blue-500 to-blue-600'
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
        
        <Animated.View 
          entering={SlideInDown.springify().damping(15)}
          exiting={SlideOutDown.duration(200)}
          className={`${config.bg} ${config.border} border-2 rounded-3xl p-8 w-full max-w-sm shadow-2xl`}
        >
          {/* Icon Header */}
          <View className="items-center mb-6">
            <View className={`w-20 h-20 rounded-full bg-gradient-to-br ${config.gradient} items-center justify-center mb-4 shadow-lg`}>
              <Text className="text-4xl">{config.icon}</Text>
            </View>
            <Text className={`${config.text} text-2xl font-bold text-center`}>
              {title}
            </Text>
          </View>

          {/* Message */}
          <Text className={`${config.text} text-base mb-8 leading-6 text-center`}>
            {message}
          </Text>

          {/* Action Button */}
          <TouchableOpacity
            onPress={onClose}
            className={`${config.button} py-4 px-8 rounded-2xl active:scale-95 transition-transform`}
          >
            <Text className="text-white text-center font-bold text-lg">
              {confirmText}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}