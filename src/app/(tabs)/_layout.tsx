import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';

import { font, useTheme } from '@/theme';

export default function TabsLayout() {
  const t = useTheme();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: t.primary,
        tabBarInactiveTintColor: t.textMuted,
        tabBarStyle: { backgroundColor: t.surface, borderTopColor: t.border },
        tabBarLabelStyle: { fontFamily: font.medium, fontSize: 12 },
        headerShadowVisible: false,
        headerStyle: { backgroundColor: t.bg },
        headerTitleStyle: { fontFamily: font.semibold, color: t.text },
        sceneStyle: { backgroundColor: t.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Upcoming',
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'navigate' : 'navigate-outline'} size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'options' : 'options-outline'} size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
