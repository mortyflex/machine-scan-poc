import { StyleSheet, View, type ViewProps } from 'react-native';

import { useAppTheme } from '@/shared/theme';

export type CardProps = ViewProps;

export function Card({ style, children, ...rest }: CardProps) {
  const theme = useAppTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.colors.surface },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

// Premium cards (Phase 6.6.8): no visible border — the card reads through
// its relief (soft deep shadow) on the warm page background.
const styles = StyleSheet.create({
  card: {
    borderRadius: 28,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 22,
    elevation: 5,
  },
});