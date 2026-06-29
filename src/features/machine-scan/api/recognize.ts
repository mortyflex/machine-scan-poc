import type { MachineRecognitionResult } from '@/features/machine-scan/types';

import { RecognitionError } from './errors';
import { mockProvider, type RecognitionProvider } from './mock-provider';
import { machineRecognitionSchema } from './schema';

const LOW_CONFIDENCE_THRESHOLD = 0.6;

export type RecognizeOptions = {
  provider?: RecognitionProvider;
};

export async function recognizeMachine(
  imageUri: string,
  options?: RecognizeOptions,
): Promise<MachineRecognitionResult> {
  if (!imageUri || imageUri.trim().length === 0) {
    throw new RecognitionError(
      'missing_image',
      'Aucune image fournie pour la reconnaissance.',
    );
  }

  const provider: RecognitionProvider = options?.provider ?? mockProvider;
  let raw: unknown;
  try {
    raw = await provider.recognize(imageUri);
  } catch (error) {
    throw new RecognitionError(
      'provider_error',
      'Le service de reconnaissance a échoué.',
      { cause: error },
    );
  }

  const parsed = machineRecognitionSchema.safeParse(raw);
  if (!parsed.success) {
    throw new RecognitionError(
      'invalid_response',
      'La réponse de reconnaissance est invalide.',
      { cause: parsed.error },
    );
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

  return result;
}

export {
  RecognitionError,
  isRecognitionError,
  type RecognitionErrorKind,
} from './errors';
export { machineRecognitionSchema } from './schema';
export { mockProvider, type RecognitionProvider } from './mock-provider';