import { StyleSheet, View } from 'react-native';

import { AppText } from '@/shared/components';
import { radius, spacing, useAppTheme } from '@/shared/theme';

export type RecognitionConfidenceProps = {
  confidence: number;
  needsConfirmation: boolean;
  uncertaintyReason: string | null;
};

const LOW_CONFIDENCE_THRESHOLD = 0.6;

export function RecognitionConfidence({
  confidence,
  needsConfirmation,
  uncertaintyReason,
}: RecognitionConfidenceProps) {
  const theme = useAppTheme();
  const percent = Math.round(confidence * 100);
  const lowConfidence = needsConfirmation || confidence < LOW_CONFIDENCE_THRESHOLD;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <AppText variant="caption" color="textSecondary">
          Confiance
        </AppText>
        <AppText variant="subtitle">{percent}%</AppText>
      </View>

      {lowConfidence && (
        <View
          style={[
            styles.badge,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.danger,
            },
          ]}
        >
          <AppText variant="caption" color="danger">
            À confirmer
          </AppText>
        </View>
      )}

      {lowConfidence && uncertaintyReason ? (
        <AppText variant="caption" color="textSecondary">
          {uncertaintyReason}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
});
