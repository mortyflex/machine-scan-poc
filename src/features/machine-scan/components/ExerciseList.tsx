import { StyleSheet, View } from 'react-native';

import { AppText, Card } from '@/shared/components';
import type {
  ExerciseDifficulty,
  MachineExercise,
} from '@/features/machine-scan/types';
import { radius, spacing, useAppTheme, type ColorToken } from '@/shared/theme';

export type ExerciseListProps = {
  exercises: MachineExercise[];
};

const difficultyColor: Record<ExerciseDifficulty, ColorToken> = {
  débutant: 'success',
  intermédiaire: 'primary',
  avancé: 'danger',
};

export function ExerciseList({ exercises }: ExerciseListProps) {
  return (
    <View style={styles.list}>
      <AppText variant="subtitle">Exercices possibles</AppText>
      {exercises.map((exercise) => (
        <ExerciseItem key={exercise.name} exercise={exercise} />
      ))}
    </View>
  );
}

function ExerciseItem({ exercise }: { exercise: MachineExercise }) {
  return (
    <Card style={styles.exercise}>
      <View style={styles.header}>
        <AppText variant="subtitle" style={styles.name}>
          {exercise.name}
        </AppText>
        <DifficultyBadge difficulty={exercise.difficulty} />
      </View>

      <Field label="Installation" value={exercise.setup} />
      <Field label="Exécution" value={exercise.execution} />

      {exercise.commonMistakes.length > 0 ? (
        <BulletField
          label="Erreurs fréquentes"
          labelColor="danger"
          items={exercise.commonMistakes}
        />
      ) : null}

      {exercise.safetyNotes.length > 0 ? (
        <BulletField
          label="Notes de sécurité"
          labelColor="success"
          items={exercise.safetyNotes}
        />
      ) : null}
    </Card>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: ExerciseDifficulty }) {
  const theme = useAppTheme();
  const color = difficultyColor[difficulty];
  return (
    <View
      style={[styles.badge, { borderColor: theme.colors[color] }]}
    >
      <AppText variant="caption" color={color}>
        {difficulty}
      </AppText>
    </View>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <AppText variant="caption" color="textSecondary">
        {label}
      </AppText>
      <AppText variant="body">{value}</AppText>
    </View>
  );
}

function BulletField({
  label,
  labelColor,
  items,
}: {
  label: string;
  labelColor: ColorToken;
  items: string[];
}) {
  return (
    <View style={styles.field}>
      <AppText variant="caption" color={labelColor}>
        {label}
      </AppText>
      {items.map((item) => (
        <AppText key={item} variant="body">
          {'\u2022'} {item}
        </AppText>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  exercise: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  name: {
    flexShrink: 1,
  },
  badge: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  field: {
    gap: spacing.xs,
  },
});
