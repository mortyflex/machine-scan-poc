import {
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useAppTheme } from '@/shared/theme';
import { appFonts } from '@/shared/theme/typography';

export type PrimaryButtonProps = Omit<PressableProps, 'style'> & {
  label: string;
  variant?: 'primary' | 'ghost' | 'danger';
  style?: StyleProp<ViewStyle>;
};

const DANGER_BG = '#FDECEC';
const DANGER_TEXT = '#B42318';

/**
 * Premium pill buttons (Phase 6.6.8): no visible borders anywhere —
 * primary is graphite with a drop shadow, ghost is a soft white pill with
 * a light shadow, danger is a pale red pill with deep red text.
 */
export function PrimaryButton({
  label,
  variant = 'primary',
  style,
  disabled,
  ...rest
}: PrimaryButtonProps) {
  const theme = useAppTheme();

  let backgroundColor: string;
  let textColor: string;
  if (disabled) {
    backgroundColor = theme.colors.surfaceBorder;
    textColor = theme.colors.textMuted;
  } else if (variant === 'primary') {
    backgroundColor = theme.colors.primary;
    textColor = theme.colors.primaryText;
  } else if (variant === 'danger') {
    backgroundColor = DANGER_BG;
    textColor = DANGER_TEXT;
  } else {
    backgroundColor = theme.colors.surface;
    textColor = theme.colors.text;
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        !disabled &&
          (variant === 'primary' ? styles.primaryShadow : styles.softShadow),
        {
          backgroundColor,
          opacity: pressed && !disabled ? 0.85 : 1,
        },
        pressed && !disabled && styles.pressed,
        style,
      ]}
      disabled={disabled}
      {...rest}
    >
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 56,
    borderRadius: 999,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryShadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 5,
  },
  softShadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  label: {
    fontFamily: appFonts.heading,
    fontSize: 16,
  },
});