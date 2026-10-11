import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { STATUS_ICON, STATUS_LABEL } from '../lib/plan';
import { radius, space, type, useTheme } from '../theme';
import type { TripStatus } from '../types';

/** Status is always shown as icon + text, never color alone. */
export function StatusPill({ status }: { status: TripStatus }) {
  const t = useTheme();
  const c = t.status[status];
  return (
    <View style={[styles.pill, { backgroundColor: c.bg }]}>
      <Ionicons name={STATUS_ICON[status]} size={14} color={c.fg} />
      <Text style={[type.caption, { color: c.fg }]}>{STATUS_LABEL[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingHorizontal: space.sm + 2,
    paddingVertical: space.xs,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
});
