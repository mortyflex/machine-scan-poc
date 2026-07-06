import assert from 'node:assert/strict';
import { test } from 'node:test';

import { machineRecognitionSchema } from './schema';
import {
  getRecognitionDebugInfo,
  recognizeServerMachine,
} from './recognition-service';

function withEnv(
  overrides: Record<string, string | undefined>,
  run: () => Promise<void> | void,
): Promise<void> | void {
  const previous: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(overrides)) {
    previous[key] = process.env[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  const restore = () => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  };
  const result = run();
  if (result instanceof Promise) {
    return result.finally(restore);
  }
  restore();
}

test('recognizeServerMachine rejects an empty imageBase64', async () => {
  await withEnv({ RECOGNITION_PROVIDER: 'mock' }, async () => {
    const result = await recognizeServerMachine({
      imageBase64: '',
      mimeType: 'image/jpeg',
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.kind, 'invalid_input');
    }
  });
});

test('recognizeServerMachine defaults to the mock provider', async () => {
  await withEnv({ RECOGNITION_PROVIDER: undefined }, async () => {
    const result = await recognizeServerMachine({
      imageBase64: 'aGVsbG8=',
      mimeType: 'image/jpeg',
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.data.machineName, 'Presse à cuisses inclinée');
      const parsed = machineRecognitionSchema.safeParse(result.data);
      assert.ok(parsed.success, 'mock result must satisfy the shared schema');
    }
  });
});

test('recognizeServerMachine reports recognition_disabled', async () => {
  await withEnv({ RECOGNITION_PROVIDER: 'disabled' }, async () => {
    const result = await recognizeServerMachine({
      imageBase64: 'aGVsbG8=',
      mimeType: 'image/jpeg',
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.kind, 'recognition_disabled');
    }
  });
});

test('gemini without an API key returns provider_error', async () => {
  await withEnv(
    { RECOGNITION_PROVIDER: 'gemini', GEMINI_API_KEY: undefined },
    async () => {
      const result = await recognizeServerMachine({
        imageBase64: 'aGVsbG8=',
        mimeType: 'image/jpeg',
      });
      assert.equal(result.ok, false);
      if (!result.ok) {
        assert.equal(result.error.kind, 'provider_error');
        assert.match(result.error.message, /GEMINI_API_KEY/);
      }
    },
  );
});

test('debug info reports key presence without exposing its value', () => {
  const secret = 'super-secret-gemini-key-123';
  withEnv(
    {
      RECOGNITION_PROVIDER: 'gemini',
      GEMINI_API_KEY: secret,
      GEMINI_RECOGNITION_MODEL: undefined,
    },
    () => {
      const info = getRecognitionDebugInfo();
      assert.equal(info.ok, true);
      assert.equal(info.provider, 'gemini');
      assert.equal(info.hasGeminiApiKey, true);
      assert.equal(info.model, 'gemini-3.1-flash-lite');
      assert.ok(!JSON.stringify(info).includes(secret));
    },
  );
  withEnv(
    { RECOGNITION_PROVIDER: undefined, GEMINI_API_KEY: undefined },
    () => {
      const info = getRecognitionDebugInfo();
      assert.equal(info.provider, 'mock');
      assert.equal(info.hasGeminiApiKey, false);
    },
  );
});
