import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AccountCard, ConnectedCalendars } from '@/components/AccountSettings';
import { CalendarLinks } from '@/components/CalendarLinks';
import { GraceStepper } from '@/components/GraceStepper';
import { ModePicker } from '@/components/ModePicker';
import { Card, Chip, SectionHeader, SwitchRow } from '@/components/ui';
import { listCalendars, type CalendarSummary } from '@/lib/calendar';
import { hasApiKey } from '@/lib/routes';
import { useSettings } from '@/lib/settings';
import { useTrips } from '@/lib/trips';
import { space, type, useTheme } from '@/theme';

const HEADS_UP = [0, 5, 10, 15, 20];
const LOOK_AHEAD = [6, 12, 24, 48];

export default function SettingsScreen() {
  const t = useTheme();
  const { settings, update } = useSettings();
  const { calendarAccess, usingDemo } = useTrips();
  const [calendars, setCalendars] = useState<CalendarSummary[]>([]);

  useEffect(() => {
    if (calendarAccess !== 'granted') return;
    listCalendars().then(setCalendars).catch(() => setCalendars([]));
  }, [calendarAccess]);

  const enabledIds = settings.calendarIds ?? calendars.map((c) => c.id);
  const toggleCalendar = (id: string, on: boolean) => {
    const next = on ? [...enabledIds, id] : enabledIds.filter((x) => x !== id);
    // Store null when everything is on, so newly added calendars are included automatically.
    update({ calendarIds: next.length === calendars.length ? null : next });
  };

  return (
    <ScrollView
      style={{ backgroundColor: t.bg }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
      <SectionHeader title="Account" />
      <AccountCard />

      <SectionHeader title="Connected calendars" />
      <ConnectedCalendars />

      <SectionHeader title="Calendar links" />
      <CalendarLinks />

      <SectionHeader title="Arrive early by" />
      <Card>
        <GraceStepper value={settings.graceMin} onChange={(graceMin) => update({ graceMin })} />
        <Text style={[type.caption, styles.helper, { color: t.textMuted }]}>
          Your grace period. It applies to every event, and you can change it for a single event on its detail screen.
        </Text>
      </Card>

      <SectionHeader title="Usually getting there by" />
      <ModePicker value={settings.defaultMode} onChange={(defaultMode) => update({ defaultMode })} />

      <SectionHeader title="Alerts" />
      <Card style={{ gap: space.md }}>
        <SwitchRow
          label="Leave alerts"
          helper="A notification when it’s time to head out."
          value={settings.notifications}
          onChange={(notifications) => update({ notifications })}
        />
        {settings.notifications ? (
          <View style={{ gap: space.sm }}>
            <Text style={[type.bodyStrong, { color: t.text }]}>Extra heads-up before</Text>
            <View style={styles.chips}>
              {HEADS_UP.map((m) => (
                <Chip key={m} label={m === 0 ? 'Off' : `${m} min`} selected={settings.headsUpMin === m} onPress={() => update({ headsUpMin: m })} />
              ))}
            </View>
          </View>
        ) : null}
      </Card>

      <SectionHeader title="Look ahead" />
      <View style={styles.chips}>
        {LOOK_AHEAD.map((h) => (
          <Chip key={h} label={`${h} hours`} selected={settings.lookAheadHours === h} onPress={() => update({ lookAheadHours: h })} />
        ))}
      </View>

      <SectionHeader title="Phone calendars" />
      <Card style={{ gap: space.sm }}>
        {calendars.length > 0 ? (
          calendars.map((c) => (
            <SwitchRow
              key={c.id}
              label={c.title}
              helper={c.account}
              color={c.color}
              value={enabledIds.includes(c.id)}
              onChange={(on) => toggleCalendar(c.id, on)}
            />
          ))
        ) : (
          <Text style={[type.body, { color: t.textMuted }]}>
            {calendarAccess === 'unavailable'
              ? 'Expo Go can’t read the phone’s calendar. Connect Google Calendar or use a calendar link instead.'
              : calendarAccess === 'denied'
                ? 'Calendar access is off. Turn it on in your phone’s Settings.'
                : 'No calendars found.'}
          </Text>
        )}
        <Text style={[type.caption, { color: t.textMuted }]}>
          Includes Apple/iCloud calendars and any Google account added to your phone.
        </Text>
      </Card>

      <SectionHeader title="Demo" />
      <Card>
        <SwitchRow
          label="Demo mode"
          helper={
            usingDemo && !settings.demoMode
              ? 'On automatically until you add a calendar.'
              : 'Use sample events and made-up travel times.'
          }
          value={settings.demoMode}
          onChange={(demoMode) => update({ demoMode })}
        />
      </Card>

      <SectionHeader title="About" />
      <Card style={{ gap: space.xs }}>
        <Text style={[type.bodyStrong, { color: t.text }]}>Google Maps</Text>
        <Text style={[type.caption, { color: t.textMuted }]}>
          {hasApiKey ? 'API key connected. Live traffic and transit schedules are on.' : 'No API key set. See the README for setup.'}
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
  helper: { marginTop: space.lg, textAlign: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
});
