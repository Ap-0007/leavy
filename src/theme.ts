import { useColorScheme, type TextStyle } from 'react-native';

import type { TripStatus } from './types';

type StatusColors = Record<TripStatus, { fg: string; bg: string }>;

export interface Theme {
  dark: boolean;
  bg: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  onPrimary: string;
  primarySoft: string;
  status: StatusColors;
}

// Flat, calm palette. Every text/background pair below meets WCAG AA (4.5:1).
const light: Theme = {
  dark: false,
  bg: '#F3F8F7',
  surface: '#FFFFFF',
  surfaceAlt: '#E7F0EE',
  text: '#0F2A28',
  textMuted: '#4A5A60',
  border: '#D3E3E0',
  primary: '#0F766E',
  onPrimary: '#FFFFFF',
  primarySoft: '#D5EFEB',
  status: {
    relaxed: { fg: '#0F766E', bg: '#D5EFEB' },
    soon: { fg: '#92400E', bg: '#FCEFD3' },
    now: { fg: '#9A3412', bg: '#FFE2CF' },
    late: { fg: '#991B1B', bg: '#FDDCDC' },
    unknown: { fg: '#4A5A60', bg: '#E7F0EE' },
  },
};

const dark: Theme = {
  dark: true,
  bg: '#0B1514',
  surface: '#13201F',
  surfaceAlt: '#1B2C2A',
  text: '#E6F2F0',
  textMuted: '#9DB3AF',
  border: '#24403C',
  primary: '#2DD4BF',
  onPrimary: '#042F2B',
  primarySoft: '#123B36',
  status: {
    relaxed: { fg: '#5EEAD4', bg: '#123B36' },
    soon: { fg: '#FCD34D', bg: '#3A2E10' },
    now: { fg: '#FDBA74', bg: '#3D2413' },
    late: { fg: '#FCA5A5', bg: '#3F1A1A' },
    unknown: { fg: '#9DB3AF', bg: '#1B2C2A' },
  },
};

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 20, pill: 999 } as const;

export const font = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const type = {
  display: { fontFamily: font.bold, fontSize: 44, lineHeight: 50, fontVariant: ['tabular-nums'] },
  title: { fontFamily: font.bold, fontSize: 28, lineHeight: 34 },
  heading: { fontFamily: font.semibold, fontSize: 18, lineHeight: 24 },
  body: { fontFamily: font.regular, fontSize: 16, lineHeight: 24 },
  bodyStrong: { fontFamily: font.semibold, fontSize: 16, lineHeight: 22 },
  caption: { fontFamily: font.medium, fontSize: 13, lineHeight: 18 },
  overline: { fontFamily: font.semibold, fontSize: 12, lineHeight: 16, letterSpacing: 0.8, textTransform: 'uppercase' },
} satisfies Record<string, TextStyle>;
