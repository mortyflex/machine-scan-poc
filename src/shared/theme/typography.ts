import { fonts } from './colors';
import { spacing } from './spacing';

export const typography = {
  display: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
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