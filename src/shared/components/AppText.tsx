import { StyleSheet, Text, type TextProps } from 'react-native';

import { useAppTheme } from '@/shared/theme';
import type { TypographyToken } from '@/shared/theme/typography';

export type AppTextProps = TextProps & {
  variant?: TypographyToken;
  color?: keyof ReturnType<typeof useAppTheme>['colors'];
  align?: 'auto' | 'left' | 'center' | 'right' | 'justify';
};

export function AppText({
  variant = 'body',
  color = 'text',
  align = 'auto',
  style,
  ...rest
}: AppTextProps) {
  const theme = useAppTheme();
  const variantStyle = theme.typography[variant];

  return (
    <Text
      style={[
        { color: theme.colors[color] },
        variantStyle,
        align !== 'auto' && { textAlign: align },
        style,
      ]}
      {...rest}
    />
  );
}

export const appTextStyles = StyleSheet.create({
  center: { textAlign: 'center' },
});