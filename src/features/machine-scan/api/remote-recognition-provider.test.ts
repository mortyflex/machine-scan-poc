import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { MobileRecognitionConfig } from './recognition-config';
import { requestRemoteRecognition } from './remote-recognition-provider';

const CONFIG: MobileRecognitionConfig = {
  provider: 'remote',
  apiBaseUrl: 'http://localhost:3000',
};

const readImageBase64 = async () => 'aGVsbG8=';

function fakeFetch(status: number, body: unknown): typeof fetch {
  return (async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })) as typeof fetch;
}

function validResult() {
  return {
    machineName: 'Tirage vertical',
    machineType: 'cable_machine',
    confidence: 0.88,
    description: 'Machine à poulie haute pour le dos.',
    primaryMuscles: ['grand dorsal'],
    secondaryMuscles: ['biceps'],
    possibleExercises: [],
    alternativeNames: ['Lat pulldown'],
    needsConfirmation: false,
    uncertaintyReason: null,
  };
}

test('remote provider posts to /api/machine-recognition and returns the validated result', async () => {
  let requestedUrl = '';
  let requestedBody = '';
  const spyFetch = (async (url: unknown, init?: RequestInit) => {
    requestedUrl = String(url);
    requestedBody = String(init?.body);
    return new Response(JSON.stringify(validResult()), { status: 200 });
  }) as typeof fetch;

  const result = await requestRemoteRecognition(
    'file:///photo.jpg',
    CONFIG,
    { readImageBase64, fetchFn: spyFetch },
  );

  assert.equal(requestedUrl, 'http://localhost:3000/api/machine-recognition');
  const body = JSON.parse(requestedBody) as Record<string, unknown>;
  assert.equal(body.imageBase64, 'aGVsbG8=');
  assert.equal(body.mimeType, 'image/jpeg');
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.data.machineName, 'Tirage vertical');
  }
});

test('remote provider returns missing_image when the local file cannot be read', async () => {
  const result = await requestRemoteRecognition('file:///photo.jpg', CONFIG, {
    readImageBase64: async () => {
      throw new Error('unreadable');
    },
    fetchFn: fakeFetch(200, validResult()),
  });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error.kind, 'missing_image');
  }
});

test('remote provider returns network_error when fetch fails', async () => {
  const failingFetch = (async () => {
    throw new TypeError('fetch failed');
  }) as typeof fetch;
  const result = await requestRemoteRecognition('file:///photo.jpg', CONFIG, {
    readImageBase64,
    fetchFn: failingFetch,
  });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error.kind, 'network_error');
  }
});

test('remote provider returns provider_error on non-2xx responses', async () => {
  const result = await requestRemoteRecognition('file:///photo.jpg', CONFIG, {
    readImageBase64,
    fetchFn: fakeFetch(503, {
      error: { kind: 'recognition_disabled', message: 'disabled' },
    }),
  });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error.kind, 'provider_error');
  }
});

test('remote provider returns invalid_response for a schema-invalid payload', async () => {
  const result = await requestRemoteRecognition('file:///photo.jpg', CONFIG, {
    readImageBase64,
    fetchFn: fakeFetch(200, { machineName: 123 }),
  });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error.kind, 'invalid_response');
  }
});
