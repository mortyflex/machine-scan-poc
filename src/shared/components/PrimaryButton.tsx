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
  variant?: 'primary' | 'ghost';
  style?: StyleProp<ViewStyle>;
};

export function PrimaryButton({
  label,
  variant = 'primary',
  style,
  disabled,
  ...rest
}: PrimaryButtonProps) {
  const theme = useAppTheme();
  const isPrimary = variant === 'primary';
  const backgroundColor = disabled
    ? theme.colors.surfaceBorder
    : isPrimary
      ? theme.colors.primary
      : 'transparent';
  const textColor = disabled
    ? theme.colors.textMuted
    : isPrimary
      ? theme.colors.primaryText
      : theme.colors.text;
  const borderColor = disabled
    ? theme.colors.surfaceBorder
    : isPrimary
      ? theme.colors.primary
      : theme.colors.surfaceBorder;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        isPrimary && !disabled && styles.primaryShadow,
        {
          backgroundColor,
          borderColor,
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
    borderWidth: 1,
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
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  label: {
    fontFamily: appFonts.heading,
    fontSize: 16,
  },
});