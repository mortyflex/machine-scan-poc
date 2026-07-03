export type ServerCutoutProvider = 'disabled' | 'remove-bg';

export type ServerCutoutErrorKind =
  | 'invalid_input'
  | 'cutout_disabled'
  | 'cutout_failed'
  | 'provider_error'
  | 'invalid_response';

export type ServerCutoutResult =
  | {
      ok: true;
      data: {
        cutoutBase64: string;
        mimeType: 'image/png';
      };
    }
  | {
      ok: false;
      error: {
        kind: ServerCutoutErrorKind;
        message: string;
        cause?: unknown;
      };
    };

export type CutoutRequest = {
  imageBase64: string;
  mimeType: string;
};

export function resolveServerProvider(): ServerCutoutProvider {
  return process.env.CUTOUT_PROVIDER === 'remove-bg' ? 'remove-bg' : 'disabled';
}
