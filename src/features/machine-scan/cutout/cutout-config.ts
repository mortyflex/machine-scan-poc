import type { CutoutProvider } from './types';

export type MobileCutoutConfig = {
  provider: CutoutProvider;
  apiBaseUrl: string;
  rawProvider?: string;
  rawApiBaseUrl?: string;
};

const KNOWN_PROVIDERS: readonly CutoutProvider[] = [
  'disabled',
  'remote',
  'local-vision',
  'auto',
];

/**
 * Pure provider resolution, unit-testable in plain Node. Unknown or
 * missing values stay `disabled` (the historical safe default);
 * surrounding whitespace is tolerated like the recognition config.
 */
export function resolveCutoutProvider(
  rawProvider: string | undefined,
): CutoutProvider {
  const value = rawProvider?.trim();
  return (KNOWN_PROVIDERS as readonly string[]).includes(value ?? '')
    ? (value as CutoutProvider)
    : 'disabled';
}

/**
 * Centralized mobile cutout configuration. Only non-secret
 * `EXPO_PUBLIC_*` variables are read here — secret keys never exist on
 * the mobile side. `rawProvider` / `rawApiBaseUrl` are exposed for the
 * dev debug panel only, to diagnose env loading issues on device.
 */
export function getCutoutConfig(): MobileCutoutConfig {
  const rawProvider = process.env.EXPO_PUBLIC_CUTOUT_PROVIDER;
  const rawApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

  return {
    provider: resolveCutoutProvider(rawProvider),
    apiBaseUrl: rawApiBaseUrl?.trim() ?? '',
    rawProvider,
    rawApiBaseUrl,
  };
}

/**
 * `__DEV__` is a React Native global; it does not exist when the cutout
 * module runs under plain Node (unit tests), hence the typeof guard.
 */
export const isDevBuild: boolean =
  typeof __DEV__ !== 'undefined' ? __DEV__ : false;
