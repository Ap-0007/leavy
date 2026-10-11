import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { AccountCard, ConnectedCalendars } from '@/components/AccountSettings';
import { CalendarLinks } from '@/components/CalendarLinks';
import { Card, SectionHeader, SwitchRow } from '@/components/ui';
import { listCalendars, type CalendarSummary } from '@/lib/calendar';
import { hasApiKey } from '@/lib/routes';
import { useSettings } from '@/lib/settings';
import { useTrips } from '@/lib/trips';
import { space, type, useTheme } from '@/theme';

/** Account and everywhere events come from: Google, the phone's calendars, iCal links. */
export default function ConnectionsScreen() {
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
});
