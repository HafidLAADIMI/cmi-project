import React from 'react';
import { View, Text, TextInput } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface CustomerInfoCardProps {
  name: string;
  email: string;
  onNameChange: (text: string) => void;
  onEmailChange: (text: string) => void;
  delay?: number;
}

export function CustomerInfoCard({
  name,
  email,
  onNameChange,
  onEmailChange,
  delay = 0
}: CustomerInfoCardProps) {
  return (
    <Animated.View 
      entering={FadeInDown.delay(delay)}
      className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-primary border border-gray-100 dark:border-gray-700"
    >
      <View className="flex-row items-center mb-6">
        <View className="bg-primary-100 dark:bg-primary-900/30 rounded-full p-3 mr-4">
          <Text className="text-2xl">👤</Text>
        </View>
        <View>
          <Text className="text-xl font-bold text-gray-900 dark:text-white">
            Customer Information
          </Text>
          <Text className="text-gray-500 dark:text-gray-400 text-sm">
            Required for secure payment processing
          </Text>
        </View>
      </View>
      
      {/* Name Input */}
      <View className="mb-4">
        <Text className="text-gray-700 dark:text-gray-300 font-medium mb-2">
          Full Name *
        </Text>
        <View className="relative">
          <TextInput
            className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl px-4 py-4 text-gray-900 dark:text-white text-base"
            placeholder="Enter your full name"
            placeholderTextColor="#9ca3af"
            value={name}
            onChangeText={onNameChange}
            autoCapitalize="words"
          />
          <View className="absolute right-4 top-4">
            <Text className="text-lg">👤</Text>
          </View>
        </View>
      </View>
      
      {/* Email Input */}
      <View>
        <Text className="text-gray-700 dark:text-gray-300 font-medium mb-2">
          Email Address *
        </Text>
        <View className="relative">
          <TextInput
            className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl px-4 py-4 text-gray-900 dark:text-white text-base"
            placeholder="Enter your email address"
            placeholderTextColor="#9ca3af"
            value={email}
            onChangeText={onEmailChange}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View className="absolute right-4 top-4">
            <Text className="text-lg">📧</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}