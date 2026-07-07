import type { MachineRecognitionResult } from '@/features/machine-scan/types';

import type { RecognitionResult } from './errors';
import { machineRecognitionSchema } from './schema';

const LOW_CONFIDENCE_THRESHOLD = 0.6;

/**
 * Shared payload validation for every recognition provider (mock or
 * remote backend): strict Zod parse, then the conservative confidence
 * fix — a result below 0.6 can never claim it needs no confirmation,
 * even if the provider says otherwise.
 */
export function validateRecognitionPayload(raw: unknown): RecognitionResult {
  const parsed = machineRecognitionSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        kind: 'invalid_response',
        message: 'La réponse de reconnaissance est invalide.',
        cause: parsed.error,
      },
    };
  }

  const result: MachineRecognitionResult = parsed.data;
  if (
    result.confidence < LOW_CONFIDENCE_THRESHOLD &&
    !result.needsConfirmation
  ) {
    result.needsConfirmation = true;
    result.uncertaintyReason =
      result.uncertaintyReason ??
      'Confiance trop basse pour valider la reconnaissance.';
  }

  // Phase 7.3: a non-machine can never reach the UI with usable
  // exercises or muscles, even if the provider filled them by mistake.
  // The server applies the same normalization; this covers the mock
  // path and any drifting backend.
  if (!result.isSportMachine) {
    result.needsConfirmation = true;
    result.possibleExercises = [];
    result.primaryMuscles = [];
    result.secondaryMuscles = [];
    result.uncertaintyReason =
      result.uncertaintyReason ??
      "L'objet détecté n'est pas une machine ou un équipement de sport.";
  }

  return { ok: true, data: result };
}

/**
 * Phase 7.3 guard: a fresh recognition with `isSportMachine === false`
 * must never be validated, saved, or shown as machine details. Old
 * saved records never hit this guard — they are restored with
 * `isSportMachine: true` by the storage mapping.
 */
export function shouldBlockMachineValidation(
  result: MachineRecognitionResult,
): boolean {
  return result.isSportMachine === false;
}
