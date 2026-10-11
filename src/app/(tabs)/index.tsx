import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Linking, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NextTripCard, TripRow } from '@/components/TripViews';
import { Banner, Card, SectionHeader } from '@/components/ui';
import { useNow } from '@/hooks/useNow';
import { formatDay, formatTime } from '@/lib/format';
import { hasApiKey } from '@/lib/routes';
import { useSettings } from '@/lib/settings';
import { useTrips } from '@/lib/trips';
import { radius, space, type, useTheme } from '@/theme';

export default function UpcomingScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const now = useNow();
  const { settings, update } = useSettings();
  const { loading, refreshing, trips, noLocation, usingDemo, calendarAccess, locationAccess, feedErrors, updatedAt, refresh } = useTrips();
  const brokenFeeds = Object.keys(feedErrors).length;

  const [next, ...later] = trips;

  return (
    <ScrollView
      style={{ backgroundColor: t.bg }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + space.lg }]}
      refreshControl={<RefreshControl refreshing={refreshing && !loading} onRefresh={refresh} tintColor={t.primary} colors={[t.primary]} />}
    >
      <View style={styles.header}>
        <Text style={[type.overline, { color: t.textMuted }]}>{formatDay(new Date(now))}</Text>
        <Text style={[type.title, { color: t.text }]} accessibilityRole="header">
          When to leave
        </Text>
        {updatedAt ? (
          <Text style={[type.caption, { color: t.textMuted }]}>
            Updated {formatTime(updatedAt)} · pull down to refresh
          </Text>
        ) : null}
      </View>

      {usingDemo ? (
        <Banner
          icon="flask-outline"
          title="Showing sample events"
          body={
            settings.demoMode
              ? 'Demo mode is on, so travel times are made up.'
              : 'Add your Google or iCloud calendar link in Settings to see your real events.'
          }
          action={
            settings.demoMode
              ? { label: 'Use my calendar', onPress: () => update({ demoMode: false }) }
              : { label: 'Add calendar link', onPress: () => router.push('/settings') }
          }
        />
      ) : null}
      {!usingDemo && calendarAccess === 'denied' && settings.calendarFeeds.length === 0 ? (
        <Banner
          tone="warn"
          icon="calendar-outline"
          title="Calendar access is off"
          body="Allow access so the app can see where you need to be."
          action={{ label: 'Open Settings', onPress: () => Linking.openSettings() }}
        />
      ) : null}
      {!usingDemo && brokenFeeds > 0 ? (
        <Banner
          tone="warn"
          icon="link-outline"
          title={brokenFeeds === 1 ? 'A calendar link isn’t loading' : `${brokenFeeds} calendar links aren’t loading`}
          body={Object.values(feedErrors)[0]}
          action={{ label: 'Check in Settings', onPress: () => router.push('/settings') }}
        />
      ) : null}
      {!usingDemo && locationAccess === 'denied' ? (
        <Banner
          tone="warn"
          icon="location-outline"
          title="Location is off"
          body="Travel times are measured from where you are now."
          action={{ label: 'Open Settings', onPress: () => Linking.openSettings() }}
        />
      ) : null}
      {!usingDemo && !hasApiKey ? (
        <Banner
          tone="warn"
          icon="key-outline"
          title="Google Maps key missing"
          body="Add EXPO_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local and restart Expo. Until then, try demo mode in Settings."
        />
      ) : null}

      {loading ? (
        <LoadingCard />
      ) : next ? (
        <NextTripCard trip={next} now={now} />
      ) : (
        <Card style={styles.empty}>
          <Ionicons name="cafe-outline" size={36} color={t.primary} />
          <Text style={[type.heading, { color: t.text }]}>Nowhere to be</Text>
          <Text style={[type.body, { color: t.textMuted, textAlign: 'center' }]}>
            No events with a location in the next {settings.lookAheadHours} hours.
          </Text>
        </Card>
      )}

      {later.length > 0 ? (
        <>
          <SectionHeader title="Later" aside={`${later.length} trip${later.length === 1 ? '' : 's'}`} />
          {later.map((trip) => (
            <TripRow key={trip.event.key} trip={trip} now={now} />
          ))}
        </>
      ) : null}

      {noLocation.length > 0 ? (
        <>
          <SectionHeader title="No location set" />
          <Card style={{ gap: space.md }}>
            {noLocation.map((e) => (
              <View key={e.key} style={styles.noLoc}>
                <Text style={[type.bodyStrong, { color: t.text, flex: 1 }]} numberOfLines={1}>
                  {e.title}
                </Text>
                <Text style={[type.caption, { color: t.textMuted, fontVariant: ['tabular-nums'] }]}>{formatTime(e.start)}</Text>
              </View>
            ))}
            <Text style={[type.caption, { color: t.textMuted }]}>Add a location in your calendar to get a leave time.</Text>
          </Card>
        </>
      ) : null}
    </ScrollView>
  );
}

function LoadingCard() {
  const t = useTheme();
  const block = (w: number | `${number}%`, h: number) => (
    <View style={{ width: w, height: h, borderRadius: radius.sm, backgroundColor: t.surfaceAlt }} />
  );
  return (
    <Card style={{ gap: space.md }}>
      <View accessible accessibilityLabel="Loading your next trip" style={{ gap: space.md }}>
        {block(110, 24)}
        {block('60%', 44)}
        {block('80%', 18)}
        {block('50%', 18)}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
  header: { marginBottom: space.lg, gap: 2 },
  empty: { alignItems: 'center', gap: space.sm, paddingVertical: space.xxl },
  noLoc: { flexDirection: 'row', alignItems: 'center', gap: space.md },
});
