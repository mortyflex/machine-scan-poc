import { z } from 'zod';

import type { RecognitionErrorKind, RecognitionResult } from './errors';
import type { MobileRecognitionConfig } from './recognition-config';
import { validateRecognitionPayload } from './validate-recognition';

const ENDPOINT = '/api/machine-recognition';
const REQUEST_TIMEOUT_MS = 30_000;

const remoteErrorResponseSchema = z.object({
  error: z.object({
    kind: z.string(),
    message: z.string(),
  }),
});

export type RemoteRecognitionDeps = {
  /** Reads the local photo as raw base64. Injectable for plain-Node tests. */
  readImageBase64: (imageUri: string) => Promise<string>;
  fetchFn: typeof fetch;
};

/**
 * Default reader backed by expo-file-system. Lazy-imported so this
 * module stays loadable (and the fetch flow testable) in plain Node,
 * where the React Native runtime does not exist.
 */
async function defaultReadImageBase64(imageUri: string): Promise<string> {
  const { File } = await import('expo-file-system');
  return new File(imageUri).base64();
}

function guessMimeType(imageUri: string): string {
  const ext = imageUri
    .match(/\.([a-zA-Z0-9]{1,5})(?:\?|#|$)/)?.[1]
    ?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'heic') return 'image/heic';
  return 'image/jpeg';
}

function failure(
  kind: RecognitionErrorKind,
  message: string,
  cause?: unknown,
): RecognitionResult {
  console.warn(`[recognition-mobile] error kind = ${kind}`, message);
  return { ok: false, error: { kind, message, cause } };
}

/**
 * Calls the backend `POST /api/machine-recognition` endpoint with the
 * captured photo as base64 JSON and validates the returned
 * `MachineRecognitionResult` with the same strict Zod schema as the mock
 * path. Never throws for expected states and never logs the image
 * payload — the Gemini key stays on the server, this module only ever
 * sees the backend URL.
 */
export async function requestRemoteRecognition(
  imageUri: string,
  config: MobileRecognitionConfig,
  deps?: Partial<RemoteRecognitionDeps>,
): Promise<RecognitionResult> {
  const readImageBase64 = deps?.readImageBase64 ?? defaultReadImageBase64;
  const fetchFn = deps?.fetchFn ?? fetch;
  const url = `${config.apiBaseUrl}${ENDPOINT}`;

  let imageBase64: string;
  try {
    imageBase64 = await readImageBase64(imageUri);
  } catch (error) {
    return failure(
      'missing_image',
      "L'image locale n'a pas pu être lue.",
      error,
    );
  }

  // Never log the base64 payload itself — only the target and the source.
  console.log('[recognition-mobile] POST /api/machine-recognition start', {
    url,
    imageUriPrefix: imageUri.slice(0, 32),
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetchFn(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64,
        mimeType: guessMimeType(imageUri),
      }),
      signal: controller.signal,
    });
  } catch (error) {
    return failure(
      'network_error',
      'Le serveur de reconnaissance est injoignable.',
      error,
    );
  } finally {
    clearTimeout(timeout);
  }

  console.log(
    `[recognition-mobile] POST /api/machine-recognition response status = ${response.status}`,
  );

  if (!response.ok) {
    const errorBody = await response
      .json()
      .then((body) => remoteErrorResponseSchema.safeParse(body))
      .catch(() => null);
    const serverError = errorBody?.success ? errorBody.data.error : undefined;
    return failure(
      'provider_error',
      `Le serveur de reconnaissance a renvoyé le statut ${response.status}.`,
      serverError,
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch (error) {
    return failure(
      'invalid_response',
      'La réponse du serveur de reconnaissance est illisible.',
      error,
    );
  }

  const validated = validateRecognitionPayload(payload);
  if (!validated.ok) {
    console.warn(
      `[recognition-mobile] error kind = ${validated.error.kind} (schema)`,
    );
  } else {
    console.log('[recognition-mobile] result ok', {
      machineType: validated.data.machineType,
      confidence: validated.data.confidence,
      needsConfirmation: validated.data.needsConfirmation,
    });
  }
  return validated;
}
