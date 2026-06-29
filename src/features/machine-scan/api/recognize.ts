import type { MachineRecognitionResult } from '@/features/machine-scan/types';

import type { RecognitionResult } from './errors';
import { mockProvider, type RecognitionProvider } from './mock-provider';
import { machineRecognitionSchema } from './schema';

const LOW_CONFIDENCE_THRESHOLD = 0.6;

export type RecognizeOptions = {
  provider?: RecognitionProvider;
};

export async function recognizeMachine(
  imageUri: string,
  options?: RecognizeOptions,
): Promise<RecognitionResult> {
  if (!imageUri || imageUri.trim().length === 0) {
    return {
      ok: false,
      error: {
        kind: 'missing_image',
        message: 'Aucune image fournie pour la reconnaissance.',
      },
    };
  }

  const provider: RecognitionProvider = options?.provider ?? mockProvider;
  let raw: unknown;
  try {
    raw = await provider.recognize(imageUri);
  } catch (error) {
    return {
      ok: false,
      error: {
        kind: 'provider_error',
        message: 'Le service de reconnaissance a échoué.',
        cause: error,
      },
    };
  }

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

export { type RecognitionErrorKind, type RecognitionResult } from './errors';
export { machineRecognitionSchema } from './schema';
export { mockProvider, type RecognitionProvider } from './mock-provider';
