import Ionicons from '@expo/vector-icons/Ionicons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SignInButtons } from '@/components/SignInButtons';
import { LinkButton } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { radius, space, type, useTheme } from '@/theme';

const POINTS = [
  { icon: 'calendar-outline', text: 'Loads your Google or Apple calendar automatically' },
  { icon: 'car-outline', text: 'Checks live traffic and transit for each event' },
  { icon: 'notifications-outline', text: 'Tells you when to head out, a few minutes early' },
] as const;

export default function SignInScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { continueAsGuest } = useAuth();

  return (
    <ScrollView
      style={{ backgroundColor: t.bg }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + space.xxl * 2, paddingBottom: insets.bottom + space.xl }]}
    >
      <View style={[styles.logo, { backgroundColor: t.primary }]}>
        <Ionicons name="navigate" size={36} color={t.onPrimary} />
      </View>
      <Text style={[type.title, { color: t.text, textAlign: 'center' }]} accessibilityRole="header">
        Leavy
      </Text>
      <Text style={[type.body, { color: t.textMuted, textAlign: 'center' }]}>Know exactly when to leave.</Text>

      <View style={styles.points}>
        {POINTS.map((p) => (
          <View key={p.icon} style={styles.point}>
            <Ionicons name={p.icon} size={22} color={t.primary} />
            <Text style={[type.body, { color: t.text, flex: 1 }]}>{p.text}</Text>
          </View>
        ))}
      </View>

      <View style={{ gap: space.lg }}>
        <SignInButtons />
        <Text style={[type.caption, { color: t.textMuted, textAlign: 'center' }]}>
          Google sign-in also asks to read your calendar. Apple sign-in uses the calendars on this iPhone.
        </Text>
        <View style={{ alignItems: 'center' }}>
          <LinkButton label="Not now" onPress={continueAsGuest} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: space.xl, gap: space.sm },
  logo: { width: 72, height: 72, borderRadius: radius.lg, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginBottom: space.md },
  points: { gap: space.lg, marginVertical: space.xxl },
  point: { flexDirection: 'row', alignItems: 'center', gap: space.md },
});
