import { geminiRecognition, resolveGeminiModel } from './providers/gemini';
import { mockRecognition } from './providers/mock';
import {
  resolveServerRecognitionProvider,
  type RecognitionRequest,
  type ServerRecognitionProvider,
  type ServerRecognitionResult,
} from './types';

export function getActiveRecognitionProvider(): ServerRecognitionProvider {
  return resolveServerRecognitionProvider();
}

/**
 * Safe diagnostic payload for `GET /api/machine-recognition/debug`.
 * Reports whether the secret key is loaded without ever exposing its
 * value.
 */
export function getRecognitionDebugInfo(): {
  ok: true;
  provider: ServerRecognitionProvider;
  hasGeminiApiKey: boolean;
  model: string;
} {
  return {
    ok: true,
    provider: resolveServerRecognitionProvider(),
    hasGeminiApiKey: Boolean(process.env.GEMINI_API_KEY),
    model: resolveGeminiModel(),
  };
}

export async function recognizeServerMachine(
  request: RecognitionRequest,
): Promise<ServerRecognitionResult> {
  if (!request.imageBase64 || request.imageBase64.trim().length === 0) {
    return {
      ok: false,
      error: {
        kind: 'invalid_input',
        message: 'imageBase64 is required.',
      },
    };
  }

  switch (resolveServerRecognitionProvider()) {
    case 'gemini':
      return geminiRecognition(request);
    case 'disabled':
      return {
        ok: false,
        error: {
          kind: 'recognition_disabled',
          message: 'Machine recognition is disabled on the server.',
        },
      };
    case 'mock':
    default:
      return mockRecognition(request);
  }
}
