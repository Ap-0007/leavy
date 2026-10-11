import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MODE_ICON, MODE_LABEL } from '../lib/format';
import { radius, space, type, useTheme } from '../theme';
import type { TravelMode } from '../types';
import { tapFeedback } from './ui';

const MODES: TravelMode[] = ['drive', 'transit', 'walk', 'bike'];

/** Segmented control for choosing how you're getting there. */
export function ModePicker({ value, onChange }: { value: TravelMode; onChange: (m: TravelMode) => void }) {
  const t = useTheme();
  return (
    <View style={[styles.track, { backgroundColor: t.surfaceAlt }]} accessibilityRole="radiogroup" accessibilityLabel="Travel mode">
      {MODES.map((m) => {
        const selected = m === value;
        return (
          <Pressable
            key={m}
            onPress={() => {
              if (selected) return;
              tapFeedback();
              onChange(m);
            }}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            accessibilityLabel={MODE_LABEL[m]}
            style={({ pressed }) => [
              styles.segment,
              selected && { backgroundColor: t.surface, borderColor: t.border },
              pressed && !selected && { opacity: 0.7 },
            ]}
          >
            <Ionicons name={MODE_ICON[m]} size={20} color={selected ? t.primary : t.textMuted} />
            <Text style={[type.caption, { color: selected ? t.text : t.textMuted }]}>{MODE_LABEL[m]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', borderRadius: radius.md, padding: space.xs, gap: space.xs },
  segment: {
    flex: 1,
    minHeight: 52,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
  },
});
