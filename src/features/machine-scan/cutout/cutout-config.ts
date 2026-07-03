export type MobileCutoutConfig = {
  provider: 'disabled' | 'remote';
  apiBaseUrl: string;
  rawProvider?: string;
  rawApiBaseUrl?: string;
};

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
    provider: rawProvider === 'remote' ? 'remote' : 'disabled',
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
