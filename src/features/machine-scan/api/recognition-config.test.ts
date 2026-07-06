import assert from 'node:assert/strict';
import { test } from 'node:test';

import { getRecognitionConfig } from './recognition-config';

function withEnv(
  overrides: Record<string, string | undefined>,
  run: () => void,
): void {
  const previous: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(overrides)) {
    previous[key] = process.env[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  try {
    run();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

test('recognition provider defaults to mock without env', () => {
  withEnv(
    {
      EXPO_PUBLIC_RECOGNITION_PROVIDER: undefined,
      EXPO_PUBLIC_RECOGNITION_API_BASE_URL: undefined,
      EXPO_PUBLIC_API_BASE_URL: undefined,
    },
    () => {
      const config = getRecognitionConfig();
      assert.equal(config.provider, 'mock');
      assert.equal(config.apiBaseUrl, '');
    },
  );
});

test('recognition provider is remote when configured', () => {
  withEnv(
    {
      EXPO_PUBLIC_RECOGNITION_PROVIDER: 'remote',
      EXPO_PUBLIC_RECOGNITION_API_BASE_URL: 'http://localhost:3000',
    },
    () => {
      const config = getRecognitionConfig();
      assert.equal(config.provider, 'remote');
      assert.equal(config.apiBaseUrl, 'http://localhost:3000');
    },
  );
});

test('unknown recognition provider values fall back to mock', () => {
  withEnv({ EXPO_PUBLIC_RECOGNITION_PROVIDER: 'gemini-on-device' }, () => {
    const config = getRecognitionConfig();
    assert.equal(config.provider, 'mock');
  });
});

test('recognition base URL falls back to EXPO_PUBLIC_API_BASE_URL', () => {
  withEnv(
    {
      EXPO_PUBLIC_RECOGNITION_PROVIDER: 'remote',
      EXPO_PUBLIC_RECOGNITION_API_BASE_URL: undefined,
      EXPO_PUBLIC_API_BASE_URL: 'http://192.168.1.20:3000',
    },
    () => {
      const config = getRecognitionConfig();
      assert.equal(config.apiBaseUrl, 'http://192.168.1.20:3000');
    },
  );
});
