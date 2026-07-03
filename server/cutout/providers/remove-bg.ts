import type { CutoutRequest, ServerCutoutResult } from '../types';

const REMOVE_BG_ENDPOINT = 'https://api.remove.bg/v1.0/removebg';
const REQUEST_TIMEOUT_MS = 30_000;
const MESSAGE_PREVIEW_LENGTH = 300;

function toSafePreview(text: string): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, MESSAGE_PREVIEW_LENGTH);
}

/**
 * remove.bg — external background removal API.
 * https://www.remove.bg/api
 *
 * Requires `REMOVE_BG_API_KEY` in the server environment. The key never
 * reaches the mobile app, is never logged, and must never be prefixed with
 * `EXPO_PUBLIC_`. remove.bg accepts JSON-encoded bodies with
 * `image_file_b64` (alongside multipart and form-urlencoded), so the
 * base64 received from the app is forwarded as JSON. This provider is
 * isolated so it can be swapped for another segmentation backend without
 * touching the endpoint or the mobile client.
 */
export async function removeBgCutout(
  request: CutoutRequest,
): Promise<ServerCutoutResult> {
  console.log('[remove-bg] provider start');
  const apiKey = process.env.REMOVE_BG_API_KEY;
  console.log('[remove-bg] hasApiKey', Boolean(apiKey));
  console.log('[remove-bg] input', {
    mimeType: request.mimeType,
    imageBase64Length: request.imageBase64.length,
  });

  if (!apiKey) {
    console.warn('[remove-bg] failure', {
      status: undefined,
      messagePreview: 'REMOVE_BG_API_KEY is missing on the server.',
      errorKind: 'provider_error',
    });
    return {
      ok: false,
      error: {
        kind: 'provider_error',
        message: 'REMOVE_BG_API_KEY is missing on the server.',
      },
    };
  }

  console.log('[remove-bg] request start');
  let response: Response;
  try {
    response = await fetch(REMOVE_BG_ENDPOINT, {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'image/png',
      },
      body: JSON.stringify({
        image_file_b64: request.imageBase64,
        size: 'auto',
        format: 'png',
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    const messagePreview = toSafePreview(
      error instanceof Error ? `${error.name}: ${error.message}` : 'fetch failed',
    );
    console.warn('[remove-bg] failure', {
      status: undefined,
      messagePreview,
      errorKind: 'provider_error',
    });
    return {
      ok: false,
      error: {
        kind: 'provider_error',
        message: 'remove.bg is unreachable.',
        providerMessage: messagePreview,
        cause: error,
      },
    };
  }

  console.log('[remove-bg] response', {
    status: response.status,
    ok: response.ok,
    contentType: response.headers.get('content-type'),
    contentLength: response.headers.get('content-length'),
  });

  if (!response.ok) {
    // remove.bg returns JSON or text on error — read a safe preview only.
    const text = await response.text().catch(() => '');
    const messagePreview = toSafePreview(text);
    console.warn('[remove-bg] failure', {
      status: response.status,
      messagePreview,
      errorKind: 'cutout_failed',
    });
    return {
      ok: false,
      error: {
        kind: 'cutout_failed',
        message: `remove.bg returned status ${response.status}.`,
        providerStatus: response.status,
        providerMessage: messagePreview,
      },
    };
  }

  // Success responses are binary PNG (Accept: image/png) — never JSON-parse.
  try {
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length === 0) {
      console.warn('[remove-bg] failure', {
        status: response.status,
        messagePreview: 'empty image body',
        errorKind: 'invalid_response',
      });
      return {
        ok: false,
        error: {
          kind: 'invalid_response',
          message: 'remove.bg returned an empty image.',
          providerStatus: response.status,
        },
      };
    }
    const cutoutBase64 = buffer.toString('base64');
    console.log('[remove-bg] success', {
      outputBase64Length: cutoutBase64.length,
      mimeType: 'image/png',
    });
    return {
      ok: true,
      data: {
        cutoutBase64,
        mimeType: 'image/png',
      },
    };
  } catch (error) {
    console.warn('[remove-bg] failure', {
      status: response.status,
      messagePreview: 'response body could not be read',
      errorKind: 'invalid_response',
    });
    return {
      ok: false,
      error: {
        kind: 'invalid_response',
        message: 'remove.bg response could not be read.',
        providerStatus: response.status,
        cause: error,
      },
    };
  }
}
