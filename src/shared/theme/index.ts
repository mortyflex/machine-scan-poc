import { useColorScheme } from 'react-native';

import { darkColors, lightColors, type ThemeColors } from './colors';
import { layout, radius, spacing } from './spacing';
import { typography } from './typography';

export type AppTheme = {
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  layout: typeof layout;
  typography: typeof typography;
};

function resolveTheme(scheme: ReturnType<typeof useColorScheme>): ThemeColors {
  return scheme === 'dark' ? darkColors : lightColors;
}

export function useAppTheme(): AppTheme {
  const scheme = useColorScheme();
  return {
    colors: resolveTheme(scheme),
    spacing,
    radius,
    layout,
    typography,
  };
}

export { layout, radius, spacing } from './spacing';
export { typography } from './typography';
export * from './colors';