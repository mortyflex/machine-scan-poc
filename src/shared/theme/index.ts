import { lightColors, type ThemeColors } from './colors';
import { layout, radius, spacing } from './spacing';
import { typography } from './typography';

export type AppTheme = {
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  layout: typeof layout;
  typography: typeof typography;
};

/**
 * The premium design (white dotted pages, floating white cards, warm
 * validation stage, sticker title) is light-only. The app is therefore
 * locked to the light palette regardless of the system appearance —
 * following the device dark mode produced unreadable mixes (dark cards
 * on light pages, light text on white cards). If a real dark design is
 * ever wanted, it must be a dedicated phase, not an automatic flip.
 */
export function useAppTheme(): AppTheme {
  return {
    colors: lightColors,
    spacing,
    radius,
    layout,
    typography,
  };
}

export { layout, radius, spacing } from './spacing';
export { typography } from './typography';
export * from './colors';
