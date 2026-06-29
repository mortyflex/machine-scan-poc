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
  confidence: z.number().min(0).max(1),
  description: nonEmptyString,
  primaryMuscles: stringArray,
  secondaryMuscles: stringArray,
  possibleExercises: z.array(machineExerciseSchema).min(1),
  alternativeNames: stringArray,
  needsConfirmation: z.boolean(),
  uncertaintyReason: z.string().nullable(),
});

export type MachineRecognitionRaw = z.infer<typeof machineRecognitionSchema>;