import { machineRecognitionSchema } from '../schema';
import type { RecognitionRequest, ServerRecognitionResult } from '../types';

const GEMINI_API_BASE =
  'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_GEMINI_MODEL = 'gemini-3.1-flash-lite';
const REQUEST_TIMEOUT_MS = 45_000;
const MESSAGE_PREVIEW_LENGTH = 300;
// Business rule (Phase 7): below this confidence the result must be
// user-confirmed, even if the model claims otherwise.
const CONFIRMATION_THRESHOLD = 0.75;

const MACHINE_TYPES = [
  'lower_body_machine',
  'upper_body_machine',
  'cable_machine',
  'free_weight_station',
  'cardio_machine',
  'unknown',
] as const;

const DIFFICULTIES = ['débutant', 'intermédiaire', 'avancé'] as const;

const SYSTEM_INSTRUCTION = `Tu es un assistant de reconnaissance de machines de musculation.
Analyse l'image fournie.
Retourne uniquement un JSON strict correspondant au schéma demandé.
Si l'image ne montre pas clairement une machine de musculation, un accessoire de sport, ou un objet identifiable, indique needsConfirmation=true et explique l'incertitude dans uncertaintyReason.
Si l'objet n'est pas une machine de musculation, dis-le honnêtement : machineType="unknown", confidence basse, possibleExercises vide.
N'invente jamais une machine précise (par exemple "presse à cuisses") si l'image montre autre chose (souris, chaise, téléphone...).
confidence doit être un nombre entre 0 et 1.
needsConfirmation doit être true si confidence < 0.75 ou si l'image est ambiguë.
primaryMuscles et secondaryMuscles doivent être vides si ce n'est pas une machine de musculation.
Ne donne pas de conseils médicaux.
Ne recommande pas de charges précises.
Ne crée pas d'exercices dangereux ou impossibles.
Tous les textes doivent être en français.`;

/**
 * Gemini structured-output schema (OpenAPI subset, uppercase types per
 * the REST API). Mirrors `machineRecognitionSchema`; the response is
 * still Zod-validated afterwards — this only steers generation.
 */
const GEMINI_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    machineName: { type: 'STRING' },
    machineType: { type: 'STRING', enum: [...MACHINE_TYPES] },
    confidence: { type: 'NUMBER' },
    description: { type: 'STRING' },
    primaryMuscles: { type: 'ARRAY', items: { type: 'STRING' } },
    secondaryMuscles: { type: 'ARRAY', items: { type: 'STRING' } },
    possibleExercises: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING' },
          difficulty: { type: 'STRING', enum: [...DIFFICULTIES] },
          setup: { type: 'STRING' },
          execution: { type: 'STRING' },
          commonMistakes: { type: 'ARRAY', items: { type: 'STRING' } },
          safetyNotes: { type: 'ARRAY', items: { type: 'STRING' } },
        },
        required: [
          'name',
          'difficulty',
          'setup',
          'execution',
          'commonMistakes',
          'safetyNotes',
        ],
      },
    },
    alternativeNames: { type: 'ARRAY', items: { type: 'STRING' } },
    needsConfirmation: { type: 'BOOLEAN' },
    uncertaintyReason: { type: 'STRING', nullable: true },
  },
  required: [
    'machineName',
    'machineType',
    'confidence',
    'description',
    'primaryMuscles',
    'secondaryMuscles',
    'possibleExercises',
    'alternativeNames',
    'needsConfirmation',
  ],
} as const;

export function resolveGeminiModel(): string {
  const raw = process.env.GEMINI_RECOGNITION_MODEL?.trim();
  return raw && raw.length > 0 ? raw : DEFAULT_GEMINI_MODEL;
}

function toSafePreview(text: string): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, MESSAGE_PREVIEW_LENGTH);
}

/**
 * Pre-Zod normalization of the model output. Keeps benign drift from
 * failing the whole scan: a missing uncertaintyReason becomes null and
 * an out-of-enum machineType becomes "unknown".
 */
function normalizeCandidate(raw: unknown): unknown {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return raw;
  }
  const record: Record<string, unknown> = { ...(raw as Record<string, unknown>) };
  if (record.uncertaintyReason === undefined) {
    record.uncertaintyReason = null;
  }
  if (
    typeof record.machineType === 'string' &&
    !(MACHINE_TYPES as readonly string[]).includes(record.machineType)
  ) {
    record.machineType = 'unknown';
  }
  return record;
}

function extractResponseText(payload: unknown): string | null {
  if (typeof payload !== 'object' || payload === null) return null;
  const candidates = (payload as Record<string, unknown>).candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) return null;
  const first = candidates[0] as Record<string, unknown> | undefined;
  const content = first?.content as Record<string, unknown> | undefined;
  const parts = content?.parts;
  if (!Array.isArray(parts)) return null;
  const text = parts
    .map((part) =>
      typeof (part as Record<string, unknown>)?.text === 'string'
        ? ((part as Record<string, unknown>).text as string)
        : '',
    )
    .join('');
  return text.length > 0 ? text : null;
}

/**
 * Gemini vision provider — server-only. Requires `GEMINI_API_KEY` in the
 * server environment; the key never reaches the mobile app, is never
 * logged, and must never be prefixed with `EXPO_PUBLIC_`. The model is
 * configurable through `GEMINI_RECOGNITION_MODEL`. `fetchFn` is
 * injectable for tests.
 */
export async function geminiRecognition(
  request: RecognitionRequest,
  fetchFn: typeof fetch = fetch,
): Promise<ServerRecognitionResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = resolveGeminiModel();
  console.log('[gemini-recognition] request', {
    hasApiKey: Boolean(apiKey),
    model,
    mimeType: request.mimeType,
    imageBase64Length: request.imageBase64.length,
  });

  if (!apiKey) {
    return {
      ok: false,
      error: {
        kind: 'provider_error',
        message: 'GEMINI_API_KEY is missing on the server.',
      },
    };
  }

  let response: Response;
  try {
    response = await fetchFn(`${GEMINI_API_BASE}/${model}:generateContent`, {
      method: 'POST',
      headers: {
        'x-goog-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_INSTRUCTION }],
        },
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: request.mimeType,
                  data: request.imageBase64,
                },
              },
              {
                text: "Identifie la machine de musculation visible sur cette photo et réponds avec le JSON demandé.",
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
          responseSchema: GEMINI_RESPONSE_SCHEMA,
        },
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    const messagePreview = toSafePreview(
      error instanceof Error
        ? `${error.name}: ${error.message}`
        : 'fetch failed',
    );
    console.warn('[gemini-recognition] failure', {
      status: undefined,
      messagePreview,
      errorKind: 'network_error',
    });
    return {
      ok: false,
      error: {
        kind: 'network_error',
        message: 'Gemini is unreachable.',
        providerMessage: messagePreview,
        cause: error,
      },
    };
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    const messagePreview = toSafePreview(text);
    console.warn('[gemini-recognition] failure', {
      status: response.status,
      messagePreview,
      errorKind: 'provider_error',
    });
    return {
      ok: false,
      error: {
        kind: 'provider_error',
        message: `Gemini returned status ${response.status}.`,
        providerStatus: response.status,
        providerMessage: messagePreview,
      },
    };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch (error) {
    return {
      ok: false,
      error: {
        kind: 'invalid_response',
        message: 'Gemini response body is not valid JSON.',
        providerStatus: response.status,
        cause: error,
      },
    };
  }

  const responseText = extractResponseText(payload);
  if (!responseText) {
    console.warn('[gemini-recognition] failure', {
      status: response.status,
      messagePreview: 'no text candidate in response',
      errorKind: 'invalid_response',
    });
    return {
      ok: false,
      error: {
        kind: 'invalid_response',
        message: 'Gemini returned no usable candidate.',
        providerStatus: response.status,
      },
    };
  }

  let candidate: unknown;
  try {
    candidate = JSON.parse(responseText);
  } catch {
    console.warn('[gemini-recognition] failure', {
      status: response.status,
      messagePreview: toSafePreview(responseText),
      errorKind: 'invalid_response',
    });
    return {
      ok: false,
      error: {
        kind: 'invalid_response',
        message: 'Gemini candidate is not valid JSON.',
        providerStatus: response.status,
      },
    };
  }

  const parsed = machineRecognitionSchema.safeParse(
    normalizeCandidate(candidate),
  );
  if (!parsed.success) {
    console.warn('[gemini-recognition] failure', {
      status: response.status,
      messagePreview: toSafePreview(parsed.error.message),
      errorKind: 'invalid_response',
    });
    return {
      ok: false,
      error: {
        kind: 'invalid_response',
        message: 'Gemini result does not match MachineRecognitionResult.',
        cause: parsed.error,
      },
    };
  }

  const result = parsed.data;
  if (result.confidence < CONFIRMATION_THRESHOLD && !result.needsConfirmation) {
    result.needsConfirmation = true;
    result.uncertaintyReason =
      result.uncertaintyReason ??
      'Confiance insuffisante pour une identification certaine.';
  }

  console.log('[gemini-recognition] success', {
    machineType: result.machineType,
    confidence: result.confidence,
    needsConfirmation: result.needsConfirmation,
    exercises: result.possibleExercises.length,
  });

  return { ok: true, data: result };
}
