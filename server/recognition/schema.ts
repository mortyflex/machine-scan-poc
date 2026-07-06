/**
 * The server validates Gemini output against the exact same strict Zod
 * schema the mobile app uses, so the two sides can never drift apart.
 * The shared schema module only depends on `zod` and is safe to import
 * from plain Node.
 */
export {
  machineRecognitionSchema,
  machineTypeSchema,
  exerciseDifficultySchema,
  type MachineRecognitionRaw,
} from '../../src/features/machine-scan/api/schema';
