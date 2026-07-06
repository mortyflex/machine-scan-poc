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
              style={[styles.tag, { backgroundColor: theme.colors.primary }]}
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
              <View key={muscle} style={[styles.tag, styles.secondaryTag]}>
                <AppText variant="caption" style={styles.secondaryTagText}>
                  {muscle}
                </AppText>
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
  // Premium chips (Phase 6.6.8): no borders — graphite for primary,
  // warm cream for secondary, both identified by fill, not outline.
  tag: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
  },
  secondaryTag: {
    backgroundColor: '#F5F2E9',
  },
  secondaryTagText: {
    color: '#4A463C',
  },
});
