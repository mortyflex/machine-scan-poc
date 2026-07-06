import { StyleSheet, View } from 'react-native';

import { AppText } from '@/shared/components';
import { radius, spacing, useAppTheme } from '@/shared/theme';
import { appFonts } from '@/shared/theme/typography';

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
        <View
          style={[styles.pill, { backgroundColor: theme.colors.primary }]}
        >
          <AppText variant="caption" color="primaryText" style={styles.pillText}>
            {percent}%
          </AppText>
        </View>
      </View>

      {lowConfidence && (
        <View style={styles.badge}>
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
    backgroundColor: '#FDECEC',
  },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
  },
  pillText: {
    fontFamily: appFonts.heading,
    fontSize: 15,
    lineHeight: 20,
  },
});
