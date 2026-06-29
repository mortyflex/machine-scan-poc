import { StyleSheet, View } from 'react-native';

import { AppText, Card } from '@/shared/components';
import type {
  MachineRecognitionResult,
  MachineType,
} from '@/features/machine-scan/types';
import { spacing } from '@/shared/theme';

import { ExerciseList } from './ExerciseList';
import { MuscleTags } from './MuscleTags';
import { RecognitionConfidence } from './RecognitionConfidence';

export type MachineResultCardProps = {
  result: MachineRecognitionResult;
};

const machineTypeLabels: Record<MachineType, string> = {
  lower_body_machine: 'Bas du corps',
  upper_body_machine: 'Haut du corps',
  cable_machine: 'Machine à poulie',
  free_weight_station: 'Poste poids libres',
  cardio_machine: 'Cardio',
  unknown: 'Type inconnu',
};

export function MachineResultCard({ result }: MachineResultCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <AppText variant="title">{result.machineName}</AppText>
        <AppText variant="caption" color="textSecondary">
          {machineTypeLabels[result.machineType]}
        </AppText>
      </View>

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

      <MuscleTags
        primaryMuscles={result.primaryMuscles}
        secondaryMuscles={result.secondaryMuscles}
      />

      <ExerciseList exercises={result.possibleExercises} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  header: {
    gap: spacing.xs,
  },
});
