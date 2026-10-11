import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/lib/auth';
import { CloudSync } from '@/lib/cloudSync';
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
        <AuthProvider>
          <CloudSync />
          <TripsProvider>
            <StatusBar style={t.dark ? 'light' : 'dark'} />
            <Navigator />
          </TripsProvider>
        </AuthProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}

function Navigator() {
  const t = useTheme();
  const { ready, account, guest } = useAuth();
  if (!ready) return null;
  // Signed in, or continuing as a guest: the app. Otherwise: the welcome / sign-in screen.
  const inApp = account !== null || guest;

  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: t.bg },
        headerTintColor: t.primary,
        headerTitleStyle: { fontFamily: font.semibold, color: t.text },
        contentStyle: { backgroundColor: t.bg },
      }}
    >
      <Stack.Protected guard={inApp}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="trip/[id]" options={{ title: 'Trip', headerBackTitle: 'Back' }} />
      </Stack.Protected>
      <Stack.Protected guard={!inApp}>
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}
