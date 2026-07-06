import assert from 'node:assert/strict';
import { test } from 'node:test';

import { geminiRecognition } from './gemini';

const REQUEST = { imageBase64: 'aGVsbG8=', mimeType: 'image/jpeg' };

function withGeminiKey(run: () => Promise<void>): Promise<void> {
  const previous = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = 'test-key';
  return run().finally(() => {
    if (previous !== undefined) {
      process.env.GEMINI_API_KEY = previous;
    } else {
      delete process.env.GEMINI_API_KEY;
    }
  });
}

function fakeFetch(status: number, body: unknown): typeof fetch {
  return (async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })) as typeof fetch;
}

function geminiEnvelope(candidateJson: unknown) {
  return {
    candidates: [
      {
        content: {
          parts: [{ text: JSON.stringify(candidateJson) }],
        },
      },
    ],
  };
}

function validCandidate() {
  return {
    machineName: 'Tirage vertical',
    machineType: 'cable_machine',
    confidence: 0.88,
    description: 'Machine à poulie haute pour le dos.',
    primaryMuscles: ['grand dorsal'],
    secondaryMuscles: ['biceps'],
    possibleExercises: [
      {
        name: 'Tirage vertical prise large',
        difficulty: 'débutant',
        setup: 'Assieds-toi et attrape la barre en prise large.',
        execution: 'Tire la barre vers le haut de la poitrine.',
        commonMistakes: ['Tirer derrière la nuque'],
        safetyNotes: ['Garde le buste stable'],
      },
    ],
    alternativeNames: ['Lat pulldown'],
    needsConfirmation: false,
    uncertaintyReason: null,
  };
}

test('gemini provider returns a validated result', async () => {
  await withGeminiKey(async () => {
    const result = await geminiRecognition(
      REQUEST,
      fakeFetch(200, geminiEnvelope(validCandidate())),
    );
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.data.machineName, 'Tirage vertical');
      assert.equal(result.data.needsConfirmation, false);
    }
  });
});

test('gemini provider forces needsConfirmation below 0.75', async () => {
  await withGeminiKey(async () => {
    const candidate = {
      ...validCandidate(),
      confidence: 0.6,
      needsConfirmation: false,
    };
    const result = await geminiRecognition(
      REQUEST,
      fakeFetch(200, geminiEnvelope(candidate)),
    );
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.data.needsConfirmation, true);
      assert.ok(result.data.uncertaintyReason);
    }
  });
});

test('gemini provider coerces unknown machineType and missing uncertaintyReason', async () => {
  await withGeminiKey(async () => {
    const candidate: Record<string, unknown> = {
      ...validCandidate(),
      machineType: 'kitchen_appliance',
      possibleExercises: [],
      needsConfirmation: true,
    };
    delete candidate.uncertaintyReason;
    const result = await geminiRecognition(
      REQUEST,
      fakeFetch(200, geminiEnvelope(candidate)),
    );
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.data.machineType, 'unknown');
      assert.equal(result.data.uncertaintyReason, null);
      assert.equal(result.data.possibleExercises.length, 0);
    }
  });
});

test('gemini provider returns invalid_response for a schema-invalid candidate', async () => {
  await withGeminiKey(async () => {
    const result = await geminiRecognition(
      REQUEST,
      fakeFetch(200, geminiEnvelope({ machineName: 123, confidence: 3 })),
    );
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.kind, 'invalid_response');
    }
  });
});

test('gemini provider returns invalid_response when the candidate is not JSON', async () => {
  await withGeminiKey(async () => {
    const envelope = {
      candidates: [{ content: { parts: [{ text: 'pas du json' }] } }],
    };
    const result = await geminiRecognition(REQUEST, fakeFetch(200, envelope));
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.kind, 'invalid_response');
    }
  });
});

test('gemini provider returns provider_error on non-2xx responses', async () => {
  await withGeminiKey(async () => {
    const result = await geminiRecognition(
      REQUEST,
      fakeFetch(429, { error: { message: 'quota exceeded' } }),
    );
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.kind, 'provider_error');
      assert.equal(result.error.providerStatus, 429);
    }
  });
});

test('gemini provider returns network_error when fetch fails', async () => {
  await withGeminiKey(async () => {
    const failingFetch = (async () => {
      throw new TypeError('fetch failed');
    }) as typeof fetch;
    const result = await geminiRecognition(REQUEST, failingFetch);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.kind, 'network_error');
    }
  });
});
