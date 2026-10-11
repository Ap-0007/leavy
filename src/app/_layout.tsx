import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '@/lib/notifications';
import { SettingsProvider } from '@/lib/settings';
import { TripsProvider } from '@/lib/trips';
import { font, useTheme } from '@/theme';

export default function RootLayout() {
  const [loaded, error] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });
  const t = useTheme();
  if (!loaded && !error) return null;

  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <TripsProvider>
          <StatusBar style={t.dark ? 'light' : 'dark'} />
          <Stack
            screenOptions={{
              headerShadowVisible: false,
              headerStyle: { backgroundColor: t.bg },
              headerTintColor: t.primary,
              headerTitleStyle: { fontFamily: font.semibold, color: t.text },
              contentStyle: { backgroundColor: t.bg },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="trip/[id]" options={{ title: 'Trip', headerBackTitle: 'Back' }} />
          </Stack>
        </TripsProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
