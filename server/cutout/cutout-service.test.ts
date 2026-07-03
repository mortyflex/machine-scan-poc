import assert from 'node:assert/strict';
import { test } from 'node:test';

import { generateServerCutout, getCutoutDebugInfo } from './cutout-service';

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

test('generateServerCutout rejects an empty imageBase64', async () => {
  await withEnv({ CUTOUT_PROVIDER: 'remove-bg' }, async () => {
    const result = await generateServerCutout({
      imageBase64: '',
      mimeType: 'image/jpeg',
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.kind, 'invalid_input');
    }
  });
});

test('generateServerCutout is disabled without CUTOUT_PROVIDER', async () => {
  await withEnv({ CUTOUT_PROVIDER: undefined }, async () => {
    const result = await generateServerCutout({
      imageBase64: 'aGVsbG8=',
      mimeType: 'image/jpeg',
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.kind, 'cutout_disabled');
    }
  });
});

test('remove-bg without an API key returns provider_error', async () => {
  await withEnv(
    { CUTOUT_PROVIDER: 'remove-bg', REMOVE_BG_API_KEY: undefined },
    async () => {
      const result = await generateServerCutout({
        imageBase64: 'aGVsbG8=',
        mimeType: 'image/jpeg',
      });
      assert.equal(result.ok, false);
      if (!result.ok) {
        assert.equal(result.error.kind, 'provider_error');
      }
    },
  );
});

test('debug info reports key presence without exposing its value', () => {
  const secret = 'super-secret-test-key-123';
  withEnv(
    { CUTOUT_PROVIDER: 'remove-bg', REMOVE_BG_API_KEY: secret },
    () => {
      const info = getCutoutDebugInfo();
      assert.equal(info.ok, true);
      assert.equal(info.provider, 'remove-bg');
      assert.equal(info.hasRemoveBgApiKey, true);
      assert.equal(info.runtime, 'node');
      assert.ok(!JSON.stringify(info).includes(secret));
    },
  );
  withEnv(
    { CUTOUT_PROVIDER: undefined, REMOVE_BG_API_KEY: undefined },
    () => {
      const info = getCutoutDebugInfo();
      assert.equal(info.provider, 'disabled');
      assert.equal(info.hasRemoveBgApiKey, false);
    },
  );
});
