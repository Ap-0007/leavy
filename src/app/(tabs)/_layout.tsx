import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { font, useTheme } from '@/theme';

export default function TabsLayout() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: t.primary,
        tabBarInactiveTintColor: t.textMuted,
        // Taller than the default bar so the 12pt Inter labels aren't clipped.
        tabBarStyle: { backgroundColor: t.surface, borderTopColor: t.border, height: 60 + insets.bottom },
        tabBarLabelStyle: { fontFamily: font.medium, fontSize: 12, lineHeight: 16 },
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
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'navigate' : 'navigate-outline'} size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'options' : 'options-outline'} size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
