import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { AppText } from '@/shared/components';
import type {
  ExerciseDifficulty,
  MachineExercise,
} from '@/features/machine-scan/types';
import { tapLight } from '@/shared/haptics';
import { radius, spacing, useAppTheme, type ColorToken } from '@/shared/theme';
import { appFonts } from '@/shared/theme/typography';

export type ExerciseCarouselProps = {
  exercises: MachineExercise[];
};

const difficultyColor: Record<ExerciseDifficulty, ColorToken> = {
  débutant: 'success',
  intermédiaire: 'primary',
  avancé: 'danger',
};

const CARD_GAP = 14;

/**
 * Premium exercises section (Phase 6.6.8): a graphite pill button that
 * expands into a horizontally swipable carousel of exercise cards —
 * snap scrolling, no scroll indicator, one premium card per exercise.
 */
export function ExerciseCarousel({ exercises }: ExerciseCarouselProps) {
  const [open, setOpen] = useState(false);
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width * 0.78, 320);

  if (exercises.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        onPress={() => {
          tapLight();
          setOpen((value) => !value);
        }}
        hitSlop={6}
      >
        <Text style={styles.buttonLabel}>Exercices possibles</Text>
        <View style={styles.buttonMeta}>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{exercises.length}</Text>
          </View>
          <Ionicons
            name={open ? 'chevron-up' : 'chevron-forward'}
            size={18}
            color="#FFFFFF"
          />
        </View>
      </Pressable>

      {open ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={cardWidth + CARD_GAP}
          decelerationRate="fast"
          contentContainerStyle={styles.carouselContent}
          style={styles.carousel}
        >
          {exercises.map((exercise) => (
            <ExerciseCard
              key={exercise.name}
              exercise={exercise}
              width={cardWidth}
            />
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

function ExerciseCard({
  exercise,
  width,
}: {
  exercise: MachineExercise;
  width: number;
}) {
  return (
    <View style={[styles.card, { width }]}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {exercise.name}
        </Text>
        <DifficultyBadge difficulty={exercise.difficulty} />
      </View>

      <Field label="Installation" value={exercise.setup} lines={3} />
      <Field label="Exécution" value={exercise.execution} lines={4} />

      {exercise.commonMistakes.length > 0 ? (
        <Field
          label="Erreur fréquente"
          labelColor="danger"
          value={exercise.commonMistakes[0]}
          lines={2}
        />
      ) : null}
      {exercise.safetyNotes.length > 0 ? (
        <Field
          label="Sécurité"
          labelColor="success"
          value={exercise.safetyNotes[0]}
          lines={2}
        />
      ) : null}
    </View>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: ExerciseDifficulty }) {
  const theme = useAppTheme();
  const color = difficultyColor[difficulty];
  return (
    <View
      style={[styles.badge, { backgroundColor: `${theme.colors[color]}14` }]}
    >
      <AppText variant="caption" color={color}>
        {difficulty}
      </AppText>
    </View>
  );
}

function Field({
  label,
  value,
  lines,
  labelColor = 'textSecondary',
}: {
  label: string;
  value: string;
  lines: number;
  labelColor?: ColorToken;
}) {
  return (
    <View style={styles.field}>
      <AppText variant="caption" color={labelColor}>
        {label}
      </AppText>
      <AppText variant="body" numberOfLines={lines}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  button: {
    height: 58,
    borderRadius: 999,
    backgroundColor: '#161616',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 6,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  buttonLabel: {
    color: '#FFFFFF',
    fontFamily: appFonts.heading,
    fontSize: 16,
  },
  buttonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  countBadge: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    paddingHorizontal: 8,
    backgroundColor: '#FFD65C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    color: '#111111',
    fontFamily: appFonts.heading,
    fontSize: 14,
  },
  carousel: {
    // Let the cards' shadows breathe past the scroll bounds.
    overflow: 'visible',
  },
  carouselContent: {
    gap: CARD_GAP,
    paddingVertical: 6,
    paddingRight: spacing.lg,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 20,
    gap: spacing.sm,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cardTitle: {
    flexShrink: 1,
    color: '#172334',
    fontFamily: appFonts.heading,
    fontSize: 18,
    lineHeight: 23,
  },
  badge: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
  },
  field: {
    gap: 3,
  },
});
