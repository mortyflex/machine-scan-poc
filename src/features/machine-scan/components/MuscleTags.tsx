import { StyleSheet, View } from 'react-native';

import { AppText } from '@/shared/components';
import { radius, spacing, useAppTheme } from '@/shared/theme';

export type MuscleTagsProps = {
  primaryMuscles: string[];
  secondaryMuscles: string[];
};

export function MuscleTags({
  primaryMuscles,
  secondaryMuscles,
}: MuscleTagsProps) {
  const theme = useAppTheme();
  const hasSecondary = secondaryMuscles.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.group}>
        <AppText variant="caption" color="textSecondary">
          Muscles principaux
        </AppText>
        <View style={styles.tags}>
          {primaryMuscles.map((muscle) => (
            <View
              key={muscle}
              style={[
                styles.tag,
                {
                  backgroundColor: theme.colors.primary,
                  borderColor: theme.colors.primary,
                },
              ]}
            >
              <AppText variant="caption" color="primaryText">
                {muscle}
              </AppText>
            </View>
          ))}
        </View>
      </View>

      {hasSecondary ? (
        <View style={styles.group}>
          <AppText variant="caption" color="textSecondary">
            Muscles secondaires
          </AppText>
          <View style={styles.tags}>
            {secondaryMuscles.map((muscle) => (
              <View
                key={muscle}
                style={[
                  styles.tag,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.surfaceBorder,
                  },
                ]}
              >
                <AppText variant="caption">{muscle}</AppText>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  group: {
    gap: spacing.xs,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  tag: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
});
