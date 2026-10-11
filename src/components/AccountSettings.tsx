import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { ActivityIndicator, Alert, Linking, Platform, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../lib/auth';
import { googleSignIn } from '../lib/google';
import { useSettings } from '../lib/settings';
import { useTrips } from '../lib/trips';
import { space, type, useTheme } from '../theme';
import { SignInButtons } from './SignInButtons';
import { Button, Card, LinkButton, type IconName } from './ui';

const PROVIDER_NAMES: Record<string, string> = { google: 'Google', apple: 'Apple' };

/** Connections → Account: who's signed in, or the sign-in buttons for guests. */
export function AccountCard() {
  const t = useTheme();
  const { account, signOut } = useAuth();

  if (!account) {
    return (
      <Card style={{ gap: space.md }}>
        <Text style={[type.body, { color: t.textMuted }]}>
          Sign in to load your calendar automatically and keep your settings when you switch phones.
        </Text>
        <SignInButtons />
      </Card>
    );
  }

  const confirmSignOut = () => {
    const title = 'Sign out of Leavy?';
    const body = 'Google Calendar will be disconnected on this phone. Your saved settings stay in your account.';
    if (Platform.OS === 'web') {
      if (window.confirm(`${title}\n${body}`)) signOut();
    } else {
      Alert.alert(title, body, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
      ]);
    }
  };

  return (
    <Card style={{ gap: space.md }}>
      <View style={styles.row}>
        <Ionicons name={account.provider === 'apple' ? 'logo-apple' : 'logo-google'} size={24} color={t.text} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[type.bodyStrong, { color: t.text }]} numberOfLines={1}>
            {account.name ?? account.email ?? 'Signed in'}
          </Text>
          <Text style={[type.caption, { color: t.textMuted }]} numberOfLines={1}>
            {account.name && account.email ? `${account.email} · ` : ''}
            {PROVIDER_NAMES[account.provider] ?? account.provider}
          </Text>
        </View>
      </View>
      <Text style={[type.caption, { color: t.textMuted }]}>Your settings are saved to your account.</Text>
      <Button variant="secondary" icon="log-out-outline" label="Sign out" onPress={confirmSignOut} />
    </Card>
  );
}

/** Connections → Connected calendars: Google Calendar (API) and Apple Calendar (on-device). */
export function ConnectedCalendars() {
  const t = useTheme();
  const { googleReady } = useAuth();
  const { settings, update } = useSettings();
  const { calendarAccess, googleError } = useTrips();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectGoogle = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await googleSignIn();
      if (!res) return;
      if (res.calendar) update({ googleCalendar: true, demoMode: false });
      else setError('Calendar access wasn’t allowed. Try again and tick the calendar box on Google’s screen.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Couldn’t connect Google Calendar.');
    } finally {
      setBusy(false);
    }
  };

  const googleStatus = settings.googleCalendar
    ? (googleError ?? 'Connected. Shows the calendars ticked in Google Calendar.')
    : googleReady
      ? 'Not connected.'
      : 'Needs a development build with Google sign-in set up.';

  const appleStatus =
    calendarAccess === 'granted'
      ? 'Reading calendars on this iPhone, including iCloud.'
      : calendarAccess === 'denied'
        ? 'Calendar access is off.'
        : 'Needs a development build. Expo Go can’t read the phone’s calendar.';

  return (
    <Card style={{ gap: space.lg }}>
      <View style={{ gap: space.sm }}>
        <StatusRow
          icon="logo-google"
          title="Google Calendar"
          status={googleStatus}
          ok={settings.googleCalendar && !googleError}
          warn={settings.googleCalendar && !!googleError}
        />
        {busy ? (
          <ActivityIndicator color={t.primary} style={{ minHeight: 50 }} />
        ) : settings.googleCalendar ? (
          <View style={styles.actions}>
            {googleError ? <LinkButton label="Reconnect" onPress={connectGoogle} /> : null}
            <LinkButton label="Disconnect" onPress={() => update({ googleCalendar: false })} />
          </View>
        ) : googleReady ? (
          <Button icon="link-outline" label="Connect Google Calendar" onPress={connectGoogle} />
        ) : null}
        {error ? (
          <Text role="alert" style={[type.caption, { color: t.status.late.fg }]}>
            {error}
          </Text>
        ) : null}
      </View>

      {Platform.OS === 'ios' ? (
        <View style={{ gap: space.sm }}>
          <StatusRow icon="logo-apple" title="Apple Calendar" status={appleStatus} ok={calendarAccess === 'granted'} warn={calendarAccess === 'denied'} />
          {calendarAccess === 'denied' ? <LinkButton label="Open Settings" onPress={() => Linking.openSettings()} /> : null}
        </View>
      ) : null}
    </Card>
  );
}

function StatusRow({ icon, title, status, ok, warn }: { icon: IconName; title: string; status: string; ok: boolean; warn: boolean }) {
  const t = useTheme();
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={22} color={t.text} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[type.bodyStrong, { color: t.text }]}>{title}</Text>
        <Text style={[type.caption, { color: warn ? t.status.late.fg : t.textMuted }]}>{status}</Text>
      </View>
      {ok ? <Ionicons name="checkmark-circle" size={22} color={t.primary} accessibilityLabel="Connected" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  actions: { flexDirection: 'row', gap: space.xl, paddingLeft: 22 + space.md },
});
