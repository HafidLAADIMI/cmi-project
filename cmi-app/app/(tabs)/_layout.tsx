import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Text, View } from 'react-native';

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return (
    <View className={`p-2 rounded-full ${focused ? 'bg-primary-100 dark:bg-primary-900' : ''}`}>
      <Text style={{ fontSize: focused ? 24 : 20 }}>{icon}</Text>
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: isDark ? '#9ca3af' : '#6b7280',
        tabBarStyle: {
          backgroundColor: isDark ? '#111827' : '#ffffff',
          borderTopColor: isDark ? '#374151' : '#e5e7eb',
          height: 85,
          paddingBottom: 20,
          paddingTop: 10,
        },
        headerStyle: {
          backgroundColor: isDark ? '#1f2937' : '#3b82f6',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          headerTitle: 'CMI Payment v2.0',
          tabBarIcon: ({ focused }) => <TabIcon icon="🏠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ focused }) => <TabIcon icon="📊" focused={focused} />,
        }}
      />
    </Tabs>
  );
}