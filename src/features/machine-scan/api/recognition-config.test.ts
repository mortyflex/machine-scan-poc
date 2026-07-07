import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  getRecognitionConfig,
  resolveRecognitionConfig,
} from './recognition-config';

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

test('resolveRecognitionConfig: undefined provider → mock', () => {
  const config = resolveRecognitionConfig({});
  assert.equal(config.provider, 'mock');
  assert.equal(config.apiBaseUrl, '');
});

test('resolveRecognitionConfig: mock → mock', () => {
  const config = resolveRecognitionConfig({
    EXPO_PUBLIC_RECOGNITION_PROVIDER: 'mock',
  });
  assert.equal(config.provider, 'mock');
});

test('resolveRecognitionConfig: remote → remote', () => {
  const config = resolveRecognitionConfig({
    EXPO_PUBLIC_RECOGNITION_PROVIDER: 'remote',
  });
  assert.equal(config.provider, 'remote');
});

test('resolveRecognitionConfig: remote with surrounding whitespace → remote', () => {
  const config = resolveRecognitionConfig({
    EXPO_PUBLIC_RECOGNITION_PROVIDER: ' remote ',
  });
  assert.equal(config.provider, 'remote');
});

test('resolveRecognitionConfig: invalid value → mock', () => {
  const config = resolveRecognitionConfig({
    EXPO_PUBLIC_RECOGNITION_PROVIDER: 'gemini-on-device',
  });
  assert.equal(config.provider, 'mock');
});

test('resolveRecognitionConfig: dedicated recognition URL wins', () => {
  const config = resolveRecognitionConfig({
    EXPO_PUBLIC_RECOGNITION_PROVIDER: 'remote',
    EXPO_PUBLIC_RECOGNITION_API_BASE_URL: 'http://192.168.0.43:3000',
    EXPO_PUBLIC_API_BASE_URL: 'http://other-host:9999',
  });
  assert.equal(config.apiBaseUrl, 'http://192.168.0.43:3000');
});

test('resolveRecognitionConfig: falls back to EXPO_PUBLIC_API_BASE_URL', () => {
  const config = resolveRecognitionConfig({
    EXPO_PUBLIC_RECOGNITION_PROVIDER: 'remote',
    EXPO_PUBLIC_API_BASE_URL: 'http://192.168.1.20:3000',
  });
  assert.equal(config.apiBaseUrl, 'http://192.168.1.20:3000');
});

test('getRecognitionConfig reads EXPO_PUBLIC_ env variables', () => {
  withEnv(
    {
      EXPO_PUBLIC_RECOGNITION_PROVIDER: 'remote',
      EXPO_PUBLIC_RECOGNITION_API_BASE_URL: 'http://localhost:3000',
      EXPO_PUBLIC_API_BASE_URL: undefined,
    },
    () => {
      const config = getRecognitionConfig();
      assert.equal(config.provider, 'remote');
      assert.equal(config.apiBaseUrl, 'http://localhost:3000');
    },
  );
});

test('getRecognitionConfig defaults to mock without env', () => {
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
