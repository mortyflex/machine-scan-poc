import { StyleSheet, View } from 'react-native';

import { AppText, Card } from '@/shared/components';
import type {
  MachineRecognitionResult,
  MachineType,
} from '@/features/machine-scan/types';
import { spacing } from '@/shared/theme';

import { ExerciseCarousel } from './ExerciseCarousel';
import { MuscleTags } from './MuscleTags';
import { RecognitionConfidence } from './RecognitionConfidence';

export type MachineResultCardProps = {
  result: MachineRecognitionResult;
  /**
   * Hide the name/type header — used when the machine name already lives
   * in the cutout hero card above (Phase 6.6.7), to avoid duplication.
   */
  hideName?: boolean;
};

export const machineTypeLabels: Record<MachineType, string> = {
  lower_body_machine: 'Bas du corps',
  upper_body_machine: 'Haut du corps',
  cable_machine: 'Machine à poulie',
  free_weight_station: 'Poste poids libres',
  cardio_machine: 'Cardio',
  unknown: 'Type inconnu',
};

/**
 * Details information block (Phase 6.6.8): premium sections on the warm
 * page — summary card (confidence + description), muscles card, and the
 * exercises pill button that expands into a swipable card carousel.
 */
export function MachineResultCard({ result, hideName }: MachineResultCardProps) {
  return (
    <View style={styles.stack}>
      <Card style={styles.card}>
        {!hideName ? (
          <View style={styles.header}>
            <AppText variant="title">{result.machineName}</AppText>
            <AppText variant="caption" color="textSecondary">
              {machineTypeLabels[result.machineType]}
            </AppText>
          </View>
        ) : null}

        <RecognitionConfidence
          confidence={result.confidence}
          needsConfirmation={result.needsConfirmation}
          uncertaintyReason={result.uncertaintyReason}
        />

        <AppText variant="body">{result.description}</AppText>

        {result.alternativeNames.length > 0 ? (
          <AppText variant="caption" color="textSecondary">
            Aussi appelé : {result.alternativeNames.join(', ')}
          </AppText>
        ) : null}
      </Card>

      <Card style={styles.card}>
        <AppText variant="subtitle">Muscles travaillés</AppText>
        <MuscleTags
          primaryMuscles={result.primaryMuscles}
          secondaryMuscles={result.secondaryMuscles}
        />
      </Card>

      <ExerciseCarousel exercises={result.possibleExercises} />
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.md,
  },
  card: {
    gap: spacing.md,
  },
  header: {
    gap: spacing.xs,
  },
});
