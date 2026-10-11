import { Image } from 'react-native';

import { radius, useTheme } from '../theme';

const LIGHT = require('../../assets/brand/logo-light.png');
const DARK = require('../../assets/brand/logo-dark.png');

/** The Leavy mark: black tile in light mode, white tile in dark mode. Sources are the SVGs in assets/brand. */
export function Logo({ size = 88 }: { size?: number }) {
  const t = useTheme();
  return (
    <Image
      source={t.dark ? DARK : LIGHT}
      accessibilityRole="image"
      accessibilityLabel="Leavy logo"
      style={{ width: size, height: size, borderRadius: radius.lg }}
    />
  );
}
