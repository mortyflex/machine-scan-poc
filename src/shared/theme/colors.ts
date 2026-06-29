import { Platform } from 'react-native';

export type ColorScheme = 'light' | 'dark';

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceBorder: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryText: string;
  danger: string;
  success: string;
  overlay: string;
};

export type ColorToken = keyof ThemeColors;

export const lightColors: ThemeColors = {
  background: '#FFFFFF',
  surface: '#F5F6F8',
  surfaceBorder: '#E4E6EA',
  text: '#111418',
  textSecondary: '#5B6168',
  textMuted: '#8A9099',
  primary: '#111418',
  primaryText: '#FFFFFF',
  danger: '#D8443B',
  success: '#1F9D55',
  overlay: 'rgba(0,0,0,0.45)',
};

export const darkColors: ThemeColors = {
  background: '#0B0C0E',
  surface: '#17191C',
  surfaceBorder: '#2A2D32',
  text: '#F5F6F8',
  textSecondary: '#B0B6BE',
  textMuted: '#7A8088',
  primary: '#F5F6F8',
  primaryText: '#111418',
  danger: '#FF6B61',
  success: '#3DDC84',
  overlay: 'rgba(0,0,0,0.6)',
};

export const fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    mono: 'var(--font-mono)',
  },
}) as { sans: string; mono: string };