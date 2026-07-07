/**
 * Mobile-side provider selection (Phase 8):
 * - `disabled`: no cutout, honest fallback.
 * - `remote`: backend `/api/machine-cutout` (remove.bg today).
 * - `local-vision`: on-device Apple Vision subject lift ONLY — errors when
 *   the native module is absent (always the case in Expo Go for now).
 * - `auto`: try local Apple Vision first, fall back to remote on failure.
 */
export type CutoutProvider = 'disabled' | 'remote' | 'local-vision' | 'auto';

export type CutoutMethod = 'none' | 'remote' | 'local-vision';

export type CutoutErrorKind =
  | 'invalid_input'
  | 'cutout_disabled'
  | 'cutout_unavailable'
  | 'local_provider_unavailable'
  | 'cutout_failed'
  | 'network_error'
  | 'invalid_response';

export type CutoutError = {
  kind: CutoutErrorKind;
  message: string;
  /** HTTP status reported by the external segmentation provider, if any. */
  providerStatus?: number;
  /** Safe preview of the provider error (dev debug only, never a secret). */
  providerMessage?: string;
  /** Safe local diagnostic detail (e.g. file write cause), dev debug only. */
  debugMessage?: string;
  cause?: unknown;
};

export type CutoutResult =
  | {
      ok: true;
      data: {
        cutoutUri: string;
        method: CutoutMethod;
      };
    }
  | {
      ok: false;
      error: CutoutError;
    };
