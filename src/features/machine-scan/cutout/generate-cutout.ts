import { getCutoutConfig, type MobileCutoutConfig } from './cutout-config';
import { logCutoutDebug, warnCutoutDebug } from './cutout-debug';
import type { CutoutResult } from './types';

export type LocalCutoutProviderFn = (input: {
  imageUri: string;
}) => Promise<CutoutResult>;

export type RemoteCutoutProviderFn = (
  imageUri: string,
  config: MobileCutoutConfig,
) => Promise<CutoutResult>;

/**
 * Providers are injectable for Node unit tests only; the app always uses
 * the defaults (local Apple Vision stub + backend remote provider).
 */
export type GenerateMachineCutoutDeps = {
  localProvider?: LocalCutoutProviderFn;
  remoteProvider?: RemoteCutoutProviderFn;
};

async function runLocalProvider(
  imageUri: string,
  deps: GenerateMachineCutoutDeps,
): Promise<CutoutResult> {
  try {
    const localProvider =
      deps.localProvider ??
      (await import('./local-vision-cutout-provider')).generateLocalVisionCutout;
    return await localProvider({ imageUri });
  } catch (error) {
    // The local provider must never crash the scan flow, even once it
    // wraps a real native module.
    return {
      ok: false,
      error: {
        kind: 'local_provider_unavailable',
        message: 'Le détourage local a échoué de manière inattendue.',
        cause: error,
      },
    };
  }
}

async function runRemoteProvider(
  imageUri: string,
  config: MobileCutoutConfig,
  deps: GenerateMachineCutoutDeps,
): Promise<CutoutResult> {
  if (!config.apiBaseUrl) {
    warnCutoutDebug('[cutout-mobile] remote:error', {
      kind: 'invalid_input',
      message: 'Missing EXPO_PUBLIC_API_BASE_URL',
    });
    return {
      ok: false,
      error: {
        kind: 'invalid_input',
        message: 'Missing EXPO_PUBLIC_API_BASE_URL',
      },
    };
  }

  logCutoutDebug('[cutout-mobile] remote start');

  // Lazy import: only load the (expo-file-system dependent) provider when the
  // remote cutout provider is actually needed. Keeps tests runnable in
  // plain Node without the React Native runtime.
  const remoteProvider =
    deps.remoteProvider ??
    (await import('./remote-cutout-provider')).requestRemoteCutout;
  return remoteProvider(imageUri, config);
}

export async function generateMachineCutout(
  imageUri: string,
  deps: GenerateMachineCutoutDeps = {},
): Promise<CutoutResult> {
  const config = getCutoutConfig();

  logCutoutDebug('[cutout-mobile] provider =', config.provider, {
    hasImageUri: Boolean(imageUri),
    apiBaseUrl: config.apiBaseUrl,
    rawProvider: config.rawProvider,
    rawApiBaseUrl: config.rawApiBaseUrl,
  });

  if (!imageUri || imageUri.trim().length === 0) {
    return {
      ok: false,
      error: {
        kind: 'invalid_input',
        message: 'Aucune image fournie pour le détourage.',
      },
    };
  }

  if (config.provider === 'disabled') {
    warnCutoutDebug('[cutout-mobile] disabled', {
      rawProvider: config.rawProvider,
      rawApiBaseUrl: config.rawApiBaseUrl,
    });
    return {
      ok: false,
      error: {
        kind: 'cutout_disabled',
        message: 'Le détourage est désactivé.',
      },
    };
  }

  if (config.provider === 'remote') {
    return runRemoteProvider(imageUri, config, deps);
  }

  if (config.provider === 'local-vision') {
    // Strict local mode: never touch the remote backend, surface the
    // typed local error so the UI falls back honestly.
    return runLocalProvider(imageUri, deps);
  }

  // auto: try local Apple Vision first, fall back to remote on any
  // local failure (in Expo Go the stub is always unavailable).
  const localResult = await runLocalProvider(imageUri, deps);
  if (localResult.ok) {
    return localResult;
  }
  warnCutoutDebug(
    '[cutout-mobile] local-vision unavailable, falling back to remote',
    { localErrorKind: localResult.error.kind },
  );
  return runRemoteProvider(imageUri, config, deps);
}
