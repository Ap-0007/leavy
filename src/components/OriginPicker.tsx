import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { font, radius, space, type, useTheme } from '../theme';
import { Button, Card, Chip, LinkButton } from './ui';

/**
 * Where a trip starts: the phone's current location (default) or an address typed for this event.
 * `recent` offers addresses used for other events, so home or work is one tap away.
 */
export function OriginPicker({
  value,
  recent,
  onChange,
}: {
  value: string | undefined;
  recent: string[];
  onChange: (address: string | undefined) => void;
}) {
  const t = useTheme();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');

  const save = (address: string) => {
    const trimmed = address.trim();
    if (!trimmed) return;
    onChange(trimmed);
    setEditing(false);
  };

  if (editing) {
    const suggestions = recent.filter((r) => r !== value).slice(0, 3);
    return (
      <Card style={{ gap: space.md }}>
        <Text nativeID="originLabel" style={[type.bodyStrong, { color: t.text }]}>
          Leave from this address
        </Text>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={() => save(draft)}
          placeholder="e.g. 200 University Ave W, Waterloo"
          placeholderTextColor={t.textMuted}
          accessibilityLabelledBy="originLabel"
          accessibilityLabel="Start address"
          autoFocus
          autoCorrect={false}
          textContentType="fullStreetAddress"
          returnKeyType="done"
          style={[styles.input, { color: t.text, backgroundColor: t.bg, borderColor: t.border }]}
        />
        {suggestions.length > 0 ? (
          <View style={{ gap: space.sm }}>
            <Text style={[type.caption, { color: t.textMuted }]}>Used for other events</Text>
            <View style={styles.chips}>
              {suggestions.map((r) => (
                <Chip key={r} label={r} selected={false} onPress={() => save(r)} />
              ))}
            </View>
          </View>
        ) : null}
        <Button icon="checkmark" label="Save address" onPress={() => save(draft)} />
        <View style={styles.center}>
          <LinkButton
            label="Cancel"
            onPress={() => {
              setDraft(value ?? '');
              setEditing(false);
            }}
          />
        </View>
      </Card>
    );
  }

  return (
    <Card style={{ gap: space.md }}>
      <View style={styles.row}>
        <Ionicons name={value ? 'home-outline' : 'locate-outline'} size={22} color={t.primary} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[type.bodyStrong, { color: t.text }]} numberOfLines={2}>
            {value ?? 'Current location'}
          </Text>
          <Text style={[type.caption, { color: t.textMuted }]}>
            {value ? 'Travel time is worked out from this address.' : 'Travel time is worked out from where your phone is.'}
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <LinkButton
          label={value ? 'Change address' : 'Leave from somewhere else'}
          onPress={() => {
            setDraft(value ?? '');
            setEditing(true);
          }}
        />
        {value ? <LinkButton label="Use current location" onPress={() => onChange(undefined)} /> : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  actions: { flexDirection: 'row', flexWrap: 'wrap', columnGap: space.xl, rowGap: space.sm, paddingLeft: 22 + space.md },
  center: { alignItems: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    fontFamily: font.regular,
    fontSize: 16,
  },
});
