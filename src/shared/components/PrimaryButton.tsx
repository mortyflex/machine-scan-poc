import {
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useAppTheme } from '@/shared/theme';

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
        {
          backgroundColor,
          borderColor,
          opacity: pressed && !disabled ? 0.85 : 1,
        },
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
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
});