import { StyleSheet, View, type ViewProps } from 'react-native';

import { useAppTheme } from '@/shared/theme';

export type CardProps = ViewProps;

export function Card({ style, children, ...rest }: CardProps) {
  const theme = useAppTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.surfaceBorder,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
  },
});