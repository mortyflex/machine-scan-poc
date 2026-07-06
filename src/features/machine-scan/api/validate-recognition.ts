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

  return { ok: true, data: result };
}
