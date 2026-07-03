import type { ServerCutoutResult } from '../types';

/**
 * Honest disabled provider: reports that no cutout can be generated instead
 * of pretending one exists.
 */
export async function disabledCutout(): Promise<ServerCutoutResult> {
  return {
    ok: false,
    error: {
      kind: 'cutout_disabled',
      message:
        'CUTOUT_PROVIDER is disabled on the server. Set CUTOUT_PROVIDER=remove-bg and REMOVE_BG_API_KEY to enable real cutouts.',
    },
  };
}
