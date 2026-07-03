import { disabledCutout } from './providers/disabled';
import { removeBgCutout } from './providers/remove-bg';
import {
  resolveServerProvider,
  type CutoutRequest,
  type ServerCutoutProvider,
  type ServerCutoutResult,
} from './types';

export function getActiveProvider(): ServerCutoutProvider {
  return resolveServerProvider();
}

/**
 * Safe diagnostic payload for `GET /api/machine-cutout/debug`. Reports
 * whether the secret key is loaded without ever exposing its value.
 */
export function getCutoutDebugInfo(): {
  ok: true;
  provider: ServerCutoutProvider;
  hasRemoveBgApiKey: boolean;
  nodeVersion: string;
  runtime: 'node';
} {
  return {
    ok: true,
    provider: resolveServerProvider(),
    hasRemoveBgApiKey: Boolean(process.env.REMOVE_BG_API_KEY),
    nodeVersion: process.version,
    runtime: 'node',
  };
}

export async function generateServerCutout(
  request: CutoutRequest,
): Promise<ServerCutoutResult> {
  if (!request.imageBase64 || request.imageBase64.trim().length === 0) {
    return {
      ok: false,
      error: {
        kind: 'invalid_input',
        message: 'imageBase64 is required.',
      },
    };
  }

  switch (resolveServerProvider()) {
    case 'remove-bg':
      return removeBgCutout(request);
    case 'disabled':
    default:
      return disabledCutout();
  }
}
