import { File } from 'expo-file-system';
import { z } from 'zod';

import type { MobileCutoutConfig } from './cutout-config';
import { logCutoutDebug, warnCutoutDebug } from './cutout-debug';
import type { CutoutError, CutoutErrorKind, CutoutResult } from './types';
import { writeCutoutBase64ToFile } from './write-cutout-file';

const ENDPOINT = '/api/machine-cutout';
const REQUEST_TIMEOUT_MS = 20_000;

const remoteCutoutResponseSchema = z.object({
  cutoutBase64: z.string().min(1),
  mimeType: z.string().optional(),
  method: z.string().optional(),
});

const remoteErrorResponseSchema = z.object({
  error: z.object({
    kind: z.string(),
    message: z.string(),
    providerStatus: z.number().optional(),
    providerMessage: z.string().optional(),
  }),
});

type ProviderErrorDetails = {
  providerStatus?: number;
  providerMessage?: string;
  debugMessage?: string;
};

function failure(
  kind: CutoutErrorKind,
  message: string,
  cause?: unknown,
  details?: ProviderErrorDetails,
): CutoutResult {
  warnCutoutDebug('[cutout] remote:error', {
    kind,
    message,
    providerStatus: details?.providerStatus,
    providerMessage: details?.providerMessage,
    debugMessage: details?.debugMessage,
  });
  const error: CutoutError = { kind, message };
  if (cause !== undefined) error.cause = cause;
  if (details?.providerStatus !== undefined) {
    error.providerStatus = details.providerStatus;
  }
  if (details?.providerMessage) {
    error.providerMessage = details.providerMessage.slice(0, 300);
  }
  if (details?.debugMessage) {
    error.debugMessage = details.debugMessage.slice(0, 300);
  }
  return { ok: false, error };
}

function guessMimeType(imageUri: string): string {
  const ext = imageUri.match(/\.([a-zA-Z0-9]{1,5})(?:\?|#|$)/)?.[1]?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'heic') return 'image/heic';
  return 'image/jpeg';
}

/**
 * Calls the backend `/api/machine-cutout` endpoint with the captured photo as
 * base64 JSON, writes the returned transparent PNG into the durable
 * `machine-scan-cutouts/` document folder, and returns a local `file://` URI
 * usable by Skia / expo-image.
 */
export async function requestRemoteCutout(
  imageUri: string,
  config: MobileCutoutConfig,
): Promise<CutoutResult> {
  if (!config.apiBaseUrl) {
    return failure('invalid_input', 'Missing EXPO_PUBLIC_API_BASE_URL');
  }

  const url = `${config.apiBaseUrl}${ENDPOINT}`;

  let imageBase64: string;
  try {
    imageBase64 = await new File(imageUri).base64();
  } catch (error) {
    return failure(
      'invalid_input',
      "L'image locale n'a pas pu être lue.",
      error,
    );
  }

  // Never log the base64 payload itself — only the target and the source.
  logCutoutDebug('[cutout] remote:request:start', {
    url,
    imageUriPrefix: imageUri.slice(0, 32),
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
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
      'Le backend de détourage est injoignable.',
      error,
    );
  } finally {
    clearTimeout(timeout);
  }

  logCutoutDebug('[cutout] remote:response', {
    status: response.status,
    ok: response.ok,
  });

  if (!response.ok) {
    const errorBody = await response
      .json()
      .then((body) => remoteErrorResponseSchema.safeParse(body))
      .catch(() => null);
    const serverError = errorBody?.success ? errorBody.data.error : undefined;
    if (serverError?.kind === 'cutout_disabled') {
      return failure(
        'cutout_unavailable',
        'Le détourage est désactivé côté serveur.',
      );
    }
    return failure(
      'cutout_failed',
      `Le backend a renvoyé le statut ${response.status}.`,
      serverError,
      {
        providerStatus: serverError?.providerStatus,
        providerMessage: serverError?.providerMessage,
      },
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch (error) {
    return failure(
      'invalid_response',
      'La réponse du backend est illisible.',
      error,
    );
  }

  const parsed = remoteCutoutResponseSchema.safeParse(payload);
  if (!parsed.success) {
    return failure(
      'invalid_response',
      'Aucun cutout renvoyé par le backend.',
      parsed.error,
    );
  }

  const writeResult = await writeCutoutBase64ToFile({
    cutoutBase64: parsed.data.cutoutBase64,
    mimeType: parsed.data.mimeType ?? 'image/png',
  });
  if (!writeResult.ok) {
    return failure(
      'cutout_failed',
      "L'enregistrement local du cutout a échoué.",
      writeResult.error.cause,
      { debugMessage: writeResult.error.message },
    );
  }
  return {
    ok: true,
    data: { cutoutUri: writeResult.data.cutoutUri, method: 'remote' },
  };
}
