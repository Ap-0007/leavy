import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, space, type, useTheme } from '../theme';
import { Chip, tapFeedback } from './ui';

const PRESETS = [0, 5, 10, 15, 20, 30];
const STEP = 5;
const MAX = 120;

/** Big, thumb-friendly control for "how early do you want to arrive?". */
export function GraceStepper({ value, onChange }: { value: number; onChange: (min: number) => void }) {
  const t = useTheme();
  const set = (v: number) => onChange(Math.min(MAX, Math.max(0, v)));

  return (
    <View style={{ gap: space.lg }}>
      <View style={styles.row}>
        <StepButton icon="remove" label="Five minutes less" disabled={value <= 0} onPress={() => set(value - STEP)} />
        <View
          style={styles.valueBox}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel="Grace period"
          accessibilityValue={{ text: `${value} minutes early` }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(e) => set(value + (e.nativeEvent.actionName === 'increment' ? STEP : -STEP))}
        >
          <Text style={[type.display, { color: t.text }]}>{value}</Text>
          <Text style={[type.caption, { color: t.textMuted }]}>{value === 0 ? 'arrive right on time' : 'min early'}</Text>
        </View>
        <StepButton icon="add" label="Five minutes more" disabled={value >= MAX} onPress={() => set(value + STEP)} />
      </View>
      <View style={styles.chips}>
        {PRESETS.map((p) => (
          <Chip key={p} label={p === 0 ? 'None' : `${p}m`} selected={p === value} onPress={() => set(p)} />
        ))}
      </View>
    </View>
  );
}

function StepButton({ icon, label, disabled, onPress }: { icon: 'add' | 'remove'; label: string; disabled: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={() => {
        tapFeedback();
        onPress();
      }}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.step,
        { backgroundColor: t.primarySoft, opacity: disabled ? 0.4 : pressed ? 0.75 : 1 },
      ]}
    >
      <Ionicons name={icon} size={26} color={t.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  valueBox: { alignItems: 'center', minWidth: 120 },
  step: { width: 56, height: 56, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, justifyContent: 'center' },
});
