export type RecognitionErrorKind =
  | 'missing_image'
  | 'invalid_response'
  | 'provider_error';

export class RecognitionError extends Error {
  readonly kind: RecognitionErrorKind;

  constructor(
    kind: RecognitionErrorKind,
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = 'RecognitionError';
    this.kind = kind;
  }
}

export function isRecognitionError(error: unknown): error is RecognitionError {
  return error instanceof RecognitionError;
}