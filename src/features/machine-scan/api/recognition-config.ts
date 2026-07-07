export type MobileRecognitionConfig = {
  provider: 'mock' | 'remote';
  apiBaseUrl: string;
  rawProvider?: string;
  rawApiBaseUrl?: string;
};

export type RecognitionEnv = {
  EXPO_PUBLIC_RECOGNITION_PROVIDER?: string;
  EXPO_PUBLIC_RECOGNITION_API_BASE_URL?: string;
  EXPO_PUBLIC_API_BASE_URL?: string;
};

/**
 * Pure provider resolution, unit-testable without touching process.env:
 * `remote` → remote, anything else (mock/empty/unknown) → mock, and the
 * recognition base URL falls back to the generic backend URL.
 */
export function resolveRecognitionConfig(
  env: RecognitionEnv,
): MobileRecognitionConfig {
  const rawProvider = env.EXPO_PUBLIC_RECOGNITION_PROVIDER;
  const rawApiBaseUrl =
    env.EXPO_PUBLIC_RECOGNITION_API_BASE_URL ?? env.EXPO_PUBLIC_API_BASE_URL;

  return {
    provider: rawProvider?.trim() === 'remote' ? 'remote' : 'mock',
    apiBaseUrl: rawApiBaseUrl?.trim() ?? '',
    rawProvider,
    rawApiBaseUrl,
  };
}

/**
 * Centralized mobile recognition configuration. Only non-secret
 * `EXPO_PUBLIC_*` variables are read here — the Gemini key lives on the
 * backend only and must never be prefixed with `EXPO_PUBLIC_`.
 *
 * Each variable is read as a full static `process.env.EXPO_PUBLIC_*`
 * member expression: Expo/Metro inlines these at bundle time, so dynamic
 * access (looping over process.env) would silently read nothing on
 * device. After changing an `EXPO_PUBLIC_` value, restart with
 * `npx expo start -c`.
 */
export function getRecognitionConfig(): MobileRecognitionConfig {
  return resolveRecognitionConfig({
    EXPO_PUBLIC_RECOGNITION_PROVIDER:
      process.env.EXPO_PUBLIC_RECOGNITION_PROVIDER,
    EXPO_PUBLIC_RECOGNITION_API_BASE_URL:
      process.env.EXPO_PUBLIC_RECOGNITION_API_BASE_URL,
    EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL,
  });
}
