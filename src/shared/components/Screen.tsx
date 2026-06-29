import { StyleSheet, View, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '@/shared/theme';

export type ScreenProps = ViewProps & {
  safe?: boolean;
};

export function Screen({ safe = true, style, children, ...rest }: ScreenProps) {
  const theme = useAppTheme();
  const content = (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          paddingHorizontal: theme.layout.horizontalPadding,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );

  if (!safe) return content;

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.background }]}
      edges={['top', 'bottom']}
    >
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'flex-start',
  },
});