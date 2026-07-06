import type { MachineRecognitionRaw } from './schema';

export type ServerRecognitionProvider = 'mock' | 'gemini' | 'disabled';

export type ServerRecognitionErrorKind =
  | 'invalid_input'
  | 'recognition_disabled'
  | 'provider_error'
  | 'invalid_response'
  | 'network_error';

export type ServerRecognitionResult =
  | {
      ok: true;
      data: MachineRecognitionRaw;
    }
  | {
      ok: false;
      error: {
        kind: ServerRecognitionErrorKind;
        message: string;
        /** HTTP status returned by the external provider, when known. */
        providerStatus?: number;
        /** Safe preview (≤300 chars) of the provider error body. Never contains secrets. */
        providerMessage?: string;
        cause?: unknown;
      };
    };

export type RecognitionRequest = {
  imageBase64: string;
  mimeType: string;
};

export function resolveServerRecognitionProvider(): ServerRecognitionProvider {
  const raw = process.env.RECOGNITION_PROVIDER;
  if (raw === 'gemini') return 'gemini';
  if (raw === 'disabled') return 'disabled';
  return 'mock';
}
