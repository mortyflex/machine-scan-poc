import { File } from 'expo-file-system';
import { z } from 'zod';

import type { RecognitionResult } from './errors';
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

function guessMimeType(imageUri: string): string {
  const ext = imageUri
    .match(/\.([a-zA-Z0-9]{1,5})(?:\?|#|$)/)?.[1]
    ?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'heic') return 'image/heic';
  return 'image/jpeg';
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
): Promise<RecognitionResult> {
  let imageBase64: string;
  try {
    imageBase64 = await new File(imageUri).base64();
  } catch (error) {
    return {
      ok: false,
      error: {
        kind: 'missing_image',
        message: "L'image locale n'a pas pu être lue.",
        cause: error,
      },
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${config.apiBaseUrl}${ENDPOINT}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64,
        mimeType: guessMimeType(imageUri),
      }),
      signal: controller.signal,
    });
  } catch (error) {
    return {
      ok: false,
      error: {
        kind: 'network_error',
        message: 'Le serveur de reconnaissance est injoignable.',
        cause: error,
      },
    };
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const errorBody = await response
      .json()
      .then((body) => remoteErrorResponseSchema.safeParse(body))
      .catch(() => null);
    const serverError = errorBody?.success ? errorBody.data.error : undefined;
    return {
      ok: false,
      error: {
        kind: 'provider_error',
        message: `Le serveur de reconnaissance a renvoyé le statut ${response.status}.`,
        cause: serverError,
      },
    };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch (error) {
    return {
      ok: false,
      error: {
        kind: 'invalid_response',
        message: 'La réponse du serveur de reconnaissance est illisible.',
        cause: error,
      },
    };
  }

  return validateRecognitionPayload(payload);
}
