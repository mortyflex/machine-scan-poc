import type { MachineRecognitionResult } from '@/features/machine-scan/types';

export type RecognitionErrorKind =
  | 'missing_image'
  | 'invalid_response'
  | 'provider_error';

export type RecognitionResult =
  | {
      ok: true;
      data: MachineRecognitionResult;
    }
  | {
      ok: false;
      error: {
        kind: RecognitionErrorKind;
        message: string;
        cause?: unknown;
      };
    };
