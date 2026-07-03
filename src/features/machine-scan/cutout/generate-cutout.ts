import { getCutoutConfig, isDevBuild } from './cutout-config';
import type { CutoutResult } from './types';

export async function generateMachineCutout(
  imageUri: string,
): Promise<CutoutResult> {
  const config = getCutoutConfig();

  if (isDevBuild) {
    console.info('[cutout] generateMachineCutout:start', {
      hasImageUri: Boolean(imageUri),
      provider: config.provider,
      apiBaseUrl: config.apiBaseUrl,
      rawProvider: config.rawProvider,
      rawApiBaseUrl: config.rawApiBaseUrl,
    });
  }

  if (!imageUri || imageUri.trim().length === 0) {
    return {
      ok: false,
      error: {
        kind: 'invalid_input',
        message: 'Aucune image fournie pour le détourage.',
      },
    };
  }

  if (config.provider !== 'remote') {
    if (isDevBuild) {
      console.warn('[cutout] disabled', {
        rawProvider: config.rawProvider,
        rawApiBaseUrl: config.rawApiBaseUrl,
      });
    }
    return {
      ok: false,
      error: {
        kind: 'cutout_disabled',
        message: 'Le détourage est désactivé.',
      },
    };
  }

  if (!config.apiBaseUrl) {
    if (isDevBuild) {
      console.warn('[cutout] remote:error', {
        kind: 'invalid_input',
        message: 'Missing EXPO_PUBLIC_API_BASE_URL',
      });
    }
    return {
      ok: false,
      error: {
        kind: 'invalid_input',
        message: 'Missing EXPO_PUBLIC_API_BASE_URL',
      },
    };
  }

  if (isDevBuild) {
    console.info('[cutout] remote provider selected');
  }

  // Lazy import: only load the (expo-file-system dependent) provider when the
  // remote cutout provider is actually enabled. Keeps tests runnable in
  // plain Node without the React Native runtime.
  const { requestRemoteCutout } = await import('./remote-cutout-provider');
  return requestRemoteCutout(imageUri, config);
}
