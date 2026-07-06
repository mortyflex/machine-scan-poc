export type MobileRecognitionConfig = {
  provider: 'mock' | 'remote';
  apiBaseUrl: string;
  rawProvider?: string;
  rawApiBaseUrl?: string;
};

/**
 * Centralized mobile recognition configuration. Only non-secret
 * `EXPO_PUBLIC_*` variables are read here — the Gemini key lives on the
 * backend only and must never be prefixed with `EXPO_PUBLIC_`. Unknown or
 * empty provider values fall back to the local mock provider so the app
 * keeps working offline and in tests.
 */
export function getRecognitionConfig(): MobileRecognitionConfig {
  const rawProvider = process.env.EXPO_PUBLIC_RECOGNITION_PROVIDER;
  // The recognition backend usually is the cutout backend, so the generic
  // EXPO_PUBLIC_API_BASE_URL doubles as a fallback.
  const rawApiBaseUrl =
    process.env.EXPO_PUBLIC_RECOGNITION_API_BASE_URL ??
    process.env.EXPO_PUBLIC_API_BASE_URL;

  return {
    provider: rawProvider === 'remote' ? 'remote' : 'mock',
    apiBaseUrl: rawApiBaseUrl?.trim() ?? '',
    rawProvider,
    rawApiBaseUrl,
  };
}
