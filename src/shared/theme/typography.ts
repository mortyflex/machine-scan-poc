import { fonts } from './colors';
import { spacing } from './spacing';

/**
 * Global typography (Phase 6.6.7): Plus Jakarta Sans Bold for headings,
 * Inter Regular for body copy. The families are loaded in the root layout
 * via expo-font; if loading ever fails the app still renders — React
 * Native falls back to the system font for unknown families instead of
 * crashing. fontWeight is intentionally omitted where a weighted family
 * is used, so the packaged weight is never re-synthesized.
 */
export const appFonts = {
  heading: 'PlusJakartaSans_700Bold',
  headingStrong: 'PlusJakartaSans_800ExtraBold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
} as const;

export const typography = {
  display: {
    fontFamily: appFonts.headingStrong,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  title: {
    fontFamily: appFonts.heading,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontFamily: appFonts.heading,
    fontSize: 18,
    lineHeight: 24,
  },
  body: {
    fontFamily: appFonts.body,
    fontSize: 16,
    lineHeight: 24,
  },
  caption: {
    fontFamily: appFonts.bodyMedium,
    fontSize: 13,
    lineHeight: 18,
  },
  mono: {
    fontFamily: fonts.mono,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
} as const;

export type TypographyToken = keyof typeof typography;

export const buttonHeights = {
  lg: 56,
  md: 48,
} as const;

export const listGap = spacing.md;
