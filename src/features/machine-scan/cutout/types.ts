export type CutoutProvider = 'disabled' | 'remote';

export type CutoutMethod = 'none' | 'remote';

export type CutoutErrorKind =
  | 'invalid_input'
  | 'cutout_disabled'
  | 'cutout_unavailable'
  | 'cutout_failed'
  | 'network_error'
  | 'invalid_response';

export type CutoutError = {
  kind: CutoutErrorKind;
  message: string;
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
