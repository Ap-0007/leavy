import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { GraceStepper } from '@/components/GraceStepper';
import { ModePicker } from '@/components/ModePicker';
import { Card, Chip, SectionHeader, SwitchRow } from '@/components/ui';
import { useSettings } from '@/lib/settings';
import { space, type, useTheme } from '@/theme';

const HEADS_UP = [0, 5, 10, 15, 20];
const LOOK_AHEAD = [6, 12, 24, 48];

/** How leave times are worked out: grace period, travel mode, alerts, how far ahead to look. */
export default function PreferencesScreen() {
  const t = useTheme();
  const { settings, update } = useSettings();

  return (
    <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={styles.content}>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
  helper: { marginTop: space.lg, textAlign: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
});
