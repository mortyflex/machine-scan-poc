import { disabledCutout } from './providers/disabled';
import { removeBgCutout } from './providers/remove-bg';
import {
  resolveServerProvider,
  type CutoutRequest,
  type ServerCutoutProvider,
  type ServerCutoutResult,
} from './types';

const provider = resolveServerProvider();

export function getActiveProvider(): ServerCutoutProvider {
  return provider;
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

  switch (provider) {
    case 'remove-bg':
      return removeBgCutout(request);
    case 'disabled':
    default:
      return disabledCutout();
  }
}
