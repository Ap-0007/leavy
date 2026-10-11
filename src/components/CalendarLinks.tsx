import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { feedLabel, fetchFeedEvents, forgetFeed, maskFeedUrl, normalizeFeedUrl } from '../lib/icsFeed';
import { useSettings } from '../lib/settings';
import { useTrips } from '../lib/trips';
import { font, radius, space, type, useTheme } from '../theme';
import { Button, Card, tapFeedback } from './ui';

const GOOGLE_STEPS = [
  // Zero-width spaces let the long address wrap at its slashes.
  'On a computer, go to:\ncalendar.google.com/\u200bcalendar/\u200br/\u200bsettings\n\nOn iPhone: open it in Safari, tap aA in the address bar → Request Desktop Website, then reload. (The Google Calendar app doesn’t have this setting.)',
  'In the menu on the left, scroll down to “Settings for my calendars”. It’s below General, Add calendar and Import & export.',
  'Under it, click your name. That’s your main calendar.',
  'On the right, scroll almost to the bottom to “Integrate calendar”.',
  'Copy “Secret address in iCal format” (it ends in /basic.ics). Send it to your phone, for example in Notes or an email to yourself, and paste it below.',
];

const ICLOUD_STEPS = [
  'On your iPhone, open the Calendar app.',
  'Tap Calendars at the bottom of the screen.',
  'Tap the ⓘ button next to the calendar you want.',
  'Turn on Public Calendar, then tap Share Link… → Copy.',
  'Come back to this app and paste it below.',
];

/** Settings section for adding private iCal links (Google / iCloud). */
export function CalendarLinks() {
  const t = useTheme();
  const { settings, update } = useSettings();
  const { feedErrors } = useTrips();
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'error' | 'ok'; text: string } | null>(null);
  const [open, setOpen] = useState<'google' | 'icloud' | null>(null);

  const add = async () => {
    const url = normalizeFeedUrl(draft);
    if (!url) {
      setMessage({ tone: 'error', text: 'That doesn’t look like a link. It should start with https:// or webcal://.' });
      return;
    }
    if (settings.calendarFeeds.includes(url)) {
      setMessage({ tone: 'error', text: 'You’ve already added this calendar.' });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      // Load it once now so a bad link is caught here, not silently later.
      const now = Date.now();
      const events = await fetchFeedEvents(url, new Date(now), new Date(now + settings.lookAheadHours * 3_600_000));
      update({ calendarFeeds: [...settings.calendarFeeds, url], demoMode: false });
      setDraft('');
      setOpen(null);
      setMessage({
        tone: 'ok',
        text: `Added ${feedLabel(url)}. ${events.length} event${events.length === 1 ? '' : 's'} in the next ${settings.lookAheadHours} hours.`,
      });
    } catch (e) {
      setMessage({ tone: 'error', text: e instanceof Error ? e.message : 'Couldn’t load that calendar.' });
    } finally {
      setBusy(false);
    }
  };

  const remove = (url: string) => {
    const doRemove = () => {
      forgetFeed(url);
      update({ calendarFeeds: settings.calendarFeeds.filter((u) => u !== url) });
      setMessage(null);
    };
    const title = `Remove ${feedLabel(url)}?`;
    const body = 'You’ll need to copy the link again to add it back.';
    if (Platform.OS === 'web') {
      if (window.confirm(`${title}\n${body}`)) doRemove();
    } else {
      Alert.alert(title, body, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: doRemove },
      ]);
    }
  };

  return (
    <Card style={{ gap: space.md }}>
      <Text style={[type.body, { color: t.textMuted }]}>
        No account? Paste a private calendar link instead. Works in Expo Go, so you don’t need a special build.
      </Text>

      {settings.calendarFeeds.map((url) => (
        <View key={url} style={[styles.feed, { borderColor: t.border }]}>
          <Ionicons
            name={feedErrors[url] ? 'alert-circle' : 'checkmark-circle'}
            size={22}
            color={feedErrors[url] ? t.status.late.fg : t.primary}
          />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[type.bodyStrong, { color: t.text }]}>{feedLabel(url)}</Text>
            <Text style={[type.caption, { color: feedErrors[url] ? t.status.late.fg : t.textMuted }]}>
              {feedErrors[url] ?? maskFeedUrl(url)}
            </Text>
          </View>
          <Pressable
            onPress={() => remove(url)}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${feedLabel(url)}`}
            hitSlop={8}
            style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.6 }]}
          >
            <Ionicons name="trash-outline" size={20} color={t.status.late.fg} />
          </Pressable>
        </View>
      ))}

      <View style={{ gap: space.sm }}>
        <Text style={[type.bodyStrong, { color: t.text }]} nativeID="feedLabel">
          Calendar link
        </Text>
        <TextInput
          value={draft}
          onChangeText={(v) => {
            setDraft(v);
            if (message?.tone === 'error') setMessage(null);
          }}
          onSubmitEditing={add}
          placeholder="https://calendar.google.com/…/basic.ics"
          placeholderTextColor={t.textMuted}
          accessibilityLabelledBy="feedLabel"
          accessibilityLabel="Calendar link"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          textContentType="URL"
          returnKeyType="done"
          editable={!busy}
          style={[
            styles.input,
            {
              color: t.text,
              backgroundColor: t.bg,
              borderColor: message?.tone === 'error' ? t.status.late.fg : t.border,
            },
          ]}
        />
        {message ? (
          <Text
            accessibilityLiveRegion="polite"
            role={message.tone === 'error' ? 'alert' : undefined}
            style={[type.caption, { color: message.tone === 'error' ? t.status.late.fg : t.primary }]}
          >
            {message.text}
          </Text>
        ) : null}
        {busy ? (
          <View style={styles.busy}>
            <ActivityIndicator color={t.primary} />
            <Text style={[type.caption, { color: t.textMuted }]}>Checking the link…</Text>
          </View>
        ) : (
          <Button icon="add" label="Add calendar" onPress={add} />
        )}
      </View>

      <View style={{ gap: space.xs }}>
        <Text style={[type.overline, { color: t.textMuted, marginTop: space.sm }]}>How to get your link</Text>
        <HowTo
          title="Google Calendar"
          icon="logo-google"
          steps={GOOGLE_STEPS}
          note="Can’t find “Integrate calendar”? School and work accounts often have it turned off. Use a personal Gmail calendar or the iCloud steps instead. New events can take a few hours to show up."
          open={open === 'google'}
          onToggle={() => setOpen(open === 'google' ? null : 'google')}
        />
        <HowTo
          title="iCloud (Apple) Calendar"
          icon="logo-apple"
          steps={ICLOUD_STEPS}
          note="“Public” only means anyone with the link can see it. It isn’t listed or searchable anywhere."
          open={open === 'icloud'}
          onToggle={() => setOpen(open === 'icloud' ? null : 'icloud')}
        />
        <View style={styles.privacy}>
          <Ionicons name="lock-closed-outline" size={16} color={t.textMuted} style={{ marginTop: 2 }} />
          <Text style={[type.caption, { color: t.textMuted, flex: 1 }]}>
            Treat these links like passwords: anyone with one can read that calendar. The app keeps them only on this
            phone.
          </Text>
        </View>
      </View>
    </Card>
  );
}

function HowTo({
  title,
  icon,
  steps,
  note,
  open,
  onToggle,
}: {
  title: string;
  icon: 'logo-google' | 'logo-apple';
  steps: string[];
  note: string;
  open: boolean;
  onToggle: () => void;
}) {
  const t = useTheme();
  return (
    <View style={[styles.howTo, { backgroundColor: t.surfaceAlt }]}>
      <Pressable
        onPress={() => {
          tapFeedback();
          onToggle();
        }}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`How to get your ${title} link`}
        style={({ pressed }) => [styles.howToHeader, pressed && { opacity: 0.7 }]}
      >
        <Ionicons name={icon} size={18} color={t.text} />
        <Text style={[type.bodyStrong, { color: t.text, flex: 1 }]}>{title}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={t.textMuted} />
      </Pressable>
      {open ? (
        <View style={{ gap: space.sm, paddingHorizontal: space.md, paddingBottom: space.md }}>
          {steps.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={[styles.stepNum, { backgroundColor: t.primary }]}>
                <Text style={{ color: t.onPrimary, fontFamily: font.bold, fontSize: 12 }}>{i + 1}</Text>
              </View>
              <Text style={[type.body, { color: t.text, flex: 1 }]}>{step}</Text>
            </View>
          ))}
          <Text style={[type.caption, { color: t.textMuted }]}>{note}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  feed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    fontFamily: font.regular,
    fontSize: 16,
  },
  busy: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm, minHeight: 50 },
  howTo: { borderRadius: radius.md, overflow: 'hidden' },
  howToHeader: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 48, paddingHorizontal: space.md },
  stepRow: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' },
  stepNum: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  privacy: { flexDirection: 'row', gap: space.sm, marginTop: space.sm },
});
