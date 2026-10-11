import Ionicons from '@expo/vector-icons/Ionicons';
import { router, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LogoPlaceholder } from '@/components/LogoPlaceholder';
import { NextTripCard } from '@/components/TripViews';
import { Card, SectionHeader, type IconName } from '@/components/ui';
import { useNow } from '@/hooks/useNow';
import { useAuth } from '@/lib/auth';
import { formatDay, MODE_LABEL } from '@/lib/format';
import { useSettings } from '@/lib/settings';
import { useTrips } from '@/lib/trips';
import { radius, space, type, useTheme } from '@/theme';

function greeting(hour: number) {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const now = useNow();
  const { account } = useAuth();
  const { settings } = useSettings();
  const { loading, trips, usingDemo } = useTrips();

  const firstName = account?.name?.split(' ')[0];
  const next = trips[0];
  const calendarSummary = usingDemo
    ? 'Showing sample events'
    : account
      ? `Signed in with ${account.provider === 'apple' ? 'Apple' : 'Google'}`
      : 'Not signed in';
  const prefSummary = `${settings.graceMin ? `${settings.graceMin} min early` : 'On time'} · ${MODE_LABEL[settings.defaultMode]}${
    settings.notifications ? '' : ' · Alerts off'
  }`;

  return (
    <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={[styles.content, { paddingTop: insets.top + space.xl }]}>
      <View style={styles.brand}>
        <LogoPlaceholder />
        <Text style={[type.title, { color: t.text }]} accessibilityRole="header">
          Leavy
        </Text>
        <Text style={[type.body, { color: t.textMuted }]}>Know exactly when to leave.</Text>
      </View>

      <Text style={[type.overline, { color: t.textMuted }]}>{formatDay(new Date(now))}</Text>
      <Text style={[type.heading, { color: t.text, marginBottom: space.lg }]}>
        {greeting(new Date(now).getHours())}
        {firstName ? `, ${firstName}` : ''}
      </Text>

      {loading ? null : next ? (
        <NextTripCard trip={next} now={now} />
      ) : (
        <Card style={styles.empty}>
          <Ionicons name="cafe-outline" size={28} color={t.primary} />
          <Text style={[type.body, { color: t.textMuted, flex: 1 }]}>Nowhere to be in the next {settings.lookAheadHours} hours.</Text>
        </Card>
      )}

      <SectionHeader title="Go to" />
      <View style={{ gap: space.sm }}>
        <NavRow icon="navigate-outline" title="Upcoming" detail={trips.length === 1 ? '1 trip' : `${trips.length} trips`} href="/upcoming" />
        <NavRow icon="link-outline" title="Connections" detail={calendarSummary} href="/connections" />
        <NavRow icon="options-outline" title="Preferences" detail={prefSummary} href="/preferences" />
      </View>
    </ScrollView>
  );
}

function NavRow({ icon, title, detail, href }: { icon: IconName; title: string; detail: string; href: Href }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={() => router.navigate(href)}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${detail}`}
      style={({ pressed }) => [styles.row, { backgroundColor: t.surface, borderColor: t.border }, pressed && { opacity: 0.8 }]}
    >
      <View style={[styles.rowIcon, { backgroundColor: t.primarySoft }]}>
        <Ionicons name={icon} size={20} color={t.primary} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[type.bodyStrong, { color: t.text }]}>{title}</Text>
        <Text style={[type.caption, { color: t.textMuted }]} numberOfLines={1}>
          {detail}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={t.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
  brand: { alignItems: 'center', gap: space.xs, marginBottom: space.xxl },
  empty: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 64,
  },
  rowIcon: { width: 36, height: 36, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
});
