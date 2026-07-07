import type { RecognitionResult } from './errors';
import { mockProvider, type RecognitionProvider } from './mock-provider';
import { getRecognitionConfig } from './recognition-config';
import { validateRecognitionPayload } from './validate-recognition';

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

  // An explicitly injected provider (tests) always wins over env config.
  const config = getRecognitionConfig();
  if (!options?.provider) {
    // Phase 7.1 diagnostic logs: make the provider choice visible on
    // device. Never logs image data or keys.
    console.log(`[recognition-mobile] provider = ${config.provider}`);
    console.log(
      `[recognition-mobile] apiBaseUrl = ${config.apiBaseUrl || '(empty)'}`,
    );
  }
  if (!options?.provider && config.provider === 'remote') {
    if (!config.apiBaseUrl) {
      console.warn(
        '[recognition-mobile] error kind = provider_error (missing base URL)',
      );
      return {
        ok: false,
        error: {
          kind: 'provider_error',
          message: 'Missing EXPO_PUBLIC_RECOGNITION_API_BASE_URL',
        },
      };
    }
    // Lazy import: only load the (expo-file-system dependent) provider
    // when remote recognition is enabled, keeping tests runnable in
    // plain Node without the React Native runtime.
    const { requestRemoteRecognition } = await import(
      './remote-recognition-provider'
    );
    return requestRemoteRecognition(imageUri, config);
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

  return validateRecognitionPayload(raw);
}

export { type RecognitionErrorKind, type RecognitionResult } from './errors';
export { machineRecognitionSchema } from './schema';
export { mockProvider, type RecognitionProvider } from './mock-provider';
