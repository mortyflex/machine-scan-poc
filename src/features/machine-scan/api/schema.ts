import { z } from 'zod';

export const exerciseDifficultySchema = z.enum([
  'débutant',
  'intermédiaire',
  'avancé',
]);

export const machineTypeSchema = z.enum([
  'lower_body_machine',
  'upper_body_machine',
  'cable_machine',
  'free_weight_station',
  'cardio_machine',
  'unknown',
  // Phase 7.3: honest category for photos of everyday objects (mouse,
  // chair, phone…) that are not usable gym equipment.
  'not_sport_equipment',
]);

const nonEmptyString = z.string().min(1);
const stringArray = z.array(nonEmptyString);

export const machineExerciseSchema = z.object({
  name: nonEmptyString,
  difficulty: exerciseDifficultySchema,
  setup: nonEmptyString,
  execution: nonEmptyString,
  commonMistakes: stringArray,
  safetyNotes: stringArray,
});

export const machineRecognitionSchema = z.object({
  machineName: nonEmptyString,
  machineType: machineTypeSchema,
  // Phase 7.3: required — a fresh recognition without this field is
  // invalid (no default), so providers cannot dodge the non-machine
  // decision. Old saved records get `true` at the storage boundary.
  isSportMachine: z.boolean(),
  confidence: z.number().min(0).max(1),
  description: nonEmptyString,
  primaryMuscles: stringArray,
  secondaryMuscles: stringArray,
  // Empty is allowed: when the photo does not show a gym machine, an
  // honest provider returns no exercises instead of inventing some.
  possibleExercises: z.array(machineExerciseSchema),
  alternativeNames: stringArray,
  needsConfirmation: z.boolean(),
  uncertaintyReason: z.string().nullable(),
});

export type MachineRecognitionRaw = z.infer<typeof machineRecognitionSchema>;