import { StyleSheet, Text, View } from 'react-native';

import { radius, type, useTheme } from '../theme';

/** Stand-in until there's a real logo. Swap the body for an <Image> and keep the size prop. */
export function LogoPlaceholder({ size = 88 }: { size?: number }) {
  const t = useTheme();
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="Leavy logo"
      style={[styles.box, { width: size, height: size, borderColor: t.primary, backgroundColor: t.primarySoft }]}
    >
      <Text style={[type.overline, { color: t.primary }]}>Logo</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: radius.lg, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
});
