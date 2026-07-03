import type { CutoutRequest, ServerCutoutResult } from '../types';

const REMOVE_BG_ENDPOINT = 'https://api.remove.bg/v1.0/removebg';
const REQUEST_TIMEOUT_MS = 30_000;

/**
 * remove.bg — external background removal API.
 * https://www.remove.bg/api
 *
 * Requires `REMOVE_BG_API_KEY` in the server environment. The key never
 * reaches the mobile app and must never be prefixed with `EXPO_PUBLIC_`.
 * This provider is isolated so it can be swapped for another segmentation
 * backend without touching the endpoint or the mobile client.
 */
export async function removeBgCutout(
  request: CutoutRequest,
): Promise<ServerCutoutResult> {
  const apiKey = process.env.REMOVE_BG_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      error: {
        kind: 'provider_error',
        message: 'REMOVE_BG_API_KEY is missing on the server.',
      },
    };
  }

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
    return {
      ok: false,
      error: {
        kind: 'provider_error',
        message: 'remove.bg is unreachable.',
        cause: error,
      },
    };
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    return {
      ok: false,
      error: {
        kind: 'cutout_failed',
        message: `remove.bg returned status ${response.status}${text ? `: ${text}` : ''}.`,
      },
    };
  }

  try {
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length === 0) {
      return {
        ok: false,
        error: {
          kind: 'invalid_response',
          message: 'remove.bg returned an empty image.',
        },
      };
    }
    return {
      ok: true,
      data: {
        cutoutBase64: buffer.toString('base64'),
        mimeType: 'image/png',
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: {
        kind: 'invalid_response',
        message: 'remove.bg response could not be read.',
        cause: error,
      },
    };
  }
}
