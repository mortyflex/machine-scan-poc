import assert from 'node:assert/strict';
import { test } from 'node:test';

import { resolveCutoutProvider } from './cutout-config';
import { generateMachineCutout } from './generate-cutout';
import { generateLocalVisionCutout } from './local-vision-cutout-provider';
import type { CutoutResult } from './types';

// The provider is resolved on each call, so tests control it via env.
process.env.EXPO_PUBLIC_CUTOUT_PROVIDER = 'disabled';

const IMAGE_URI = 'file:///some-image.jpg';

async function withEnv<T>(
  env: Record<string, string | undefined>,
  run: () => Promise<T>,
): Promise<T> {
  const previous: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(env)) {
    previous[key] = process.env[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  try {
    return await run();
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

const okLocalResult: CutoutResult = {
  ok: true,
  data: { cutoutUri: 'file:///cutouts/local.png', method: 'local-vision' },
};

const okRemoteResult: CutoutResult = {
  ok: true,
  data: { cutoutUri: 'file:///cutouts/remote.png', method: 'remote' },
};

test('resolveCutoutProvider supports disabled/remote/local-vision/auto', () => {
  assert.equal(resolveCutoutProvider('disabled'), 'disabled');
  assert.equal(resolveCutoutProvider('remote'), 'remote');
  assert.equal(resolveCutoutProvider('local-vision'), 'local-vision');
  assert.equal(resolveCutoutProvider('auto'), 'auto');
});

test('resolveCutoutProvider tolerates whitespace and defaults unknown/missing to disabled', () => {
  assert.equal(resolveCutoutProvider(' auto '), 'auto');
  assert.equal(resolveCutoutProvider(' remote'), 'remote');
  assert.equal(resolveCutoutProvider(undefined), 'disabled');
  assert.equal(resolveCutoutProvider(''), 'disabled');
  assert.equal(resolveCutoutProvider('not-a-real-provider'), 'disabled');
});

test('generateLocalVisionCutout stub returns local_provider_unavailable', async () => {
  const result = await generateLocalVisionCutout({ imageUri: IMAGE_URI });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error.kind, 'local_provider_unavailable');
  }
});

test('generateMachineCutout returns invalid_input for empty imageUri', async () => {
  const result = await generateMachineCutout('');
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error.kind, 'invalid_input');
  }
});

test('generateMachineCutout returns cutout_disabled when provider is disabled', async () => {
  const result = await generateMachineCutout(IMAGE_URI);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error.kind, 'cutout_disabled');
  }
});

test('generateMachineCutout returns invalid_input when remote is set without an API base URL', async () => {
  await withEnv(
    {
      EXPO_PUBLIC_CUTOUT_PROVIDER: 'remote',
      EXPO_PUBLIC_API_BASE_URL: undefined,
    },
    async () => {
      const result = await generateMachineCutout(IMAGE_URI);
      assert.equal(result.ok, false);
      if (!result.ok) {
        assert.equal(result.error.kind, 'invalid_input');
        assert.match(result.error.message, /EXPO_PUBLIC_API_BASE_URL/);
      }
    },
  );
});

test('generateMachineCutout treats unknown provider values as disabled', async () => {
  await withEnv(
    { EXPO_PUBLIC_CUTOUT_PROVIDER: 'not-a-real-provider' },
    async () => {
      const result = await generateMachineCutout(IMAGE_URI);
      assert.equal(result.ok, false);
      if (!result.ok) {
        assert.equal(result.error.kind, 'cutout_disabled');
      }
    },
  );
});

test('remote provider still receives the request (injected remote)', async () => {
  await withEnv(
    {
      EXPO_PUBLIC_CUTOUT_PROVIDER: 'remote',
      EXPO_PUBLIC_API_BASE_URL: 'http://localhost:3000',
    },
    async () => {
      let remoteCalls = 0;
      const result = await generateMachineCutout(IMAGE_URI, {
        remoteProvider: async (imageUri, config) => {
          remoteCalls += 1;
          assert.equal(imageUri, IMAGE_URI);
          assert.equal(config.apiBaseUrl, 'http://localhost:3000');
          return okRemoteResult;
        },
      });
      assert.equal(remoteCalls, 1);
      assert.deepEqual(result, okRemoteResult);
    },
  );
});

test('local-vision strict mode returns local_provider_unavailable and never calls remote', async () => {
  await withEnv(
    {
      EXPO_PUBLIC_CUTOUT_PROVIDER: 'local-vision',
      EXPO_PUBLIC_API_BASE_URL: 'http://localhost:3000',
    },
    async () => {
      let remoteCalls = 0;
      const result = await generateMachineCutout(IMAGE_URI, {
        remoteProvider: async () => {
          remoteCalls += 1;
          return okRemoteResult;
        },
      });
      assert.equal(remoteCalls, 0);
      assert.equal(result.ok, false);
      if (!result.ok) {
        assert.equal(result.error.kind, 'local_provider_unavailable');
      }
    },
  );
});

test('auto falls back to remote when the local provider is unavailable', async () => {
  await withEnv(
    {
      EXPO_PUBLIC_CUTOUT_PROVIDER: 'auto',
      EXPO_PUBLIC_API_BASE_URL: 'http://localhost:3000',
    },
    async () => {
      let remoteCalls = 0;
      const result = await generateMachineCutout(IMAGE_URI, {
        remoteProvider: async () => {
          remoteCalls += 1;
          return okRemoteResult;
        },
      });
      assert.equal(remoteCalls, 1);
      assert.deepEqual(result, okRemoteResult);
    },
  );
});

test('auto returns the local result and skips remote when the local provider succeeds', async () => {
  await withEnv(
    {
      EXPO_PUBLIC_CUTOUT_PROVIDER: 'auto',
      EXPO_PUBLIC_API_BASE_URL: 'http://localhost:3000',
    },
    async () => {
      let remoteCalls = 0;
      const result = await generateMachineCutout(IMAGE_URI, {
        localProvider: async () => okLocalResult,
        remoteProvider: async () => {
          remoteCalls += 1;
          return okRemoteResult;
        },
      });
      assert.equal(remoteCalls, 0);
      assert.deepEqual(result, okLocalResult);
    },
  );
});

test('auto never throws when the local provider crashes and still falls back to remote', async () => {
  await withEnv(
    {
      EXPO_PUBLIC_CUTOUT_PROVIDER: 'auto',
      EXPO_PUBLIC_API_BASE_URL: 'http://localhost:3000',
    },
    async () => {
      const result = await generateMachineCutout(IMAGE_URI, {
        localProvider: async () => {
          throw new Error('native module exploded');
        },
        remoteProvider: async () => okRemoteResult,
      });
      assert.deepEqual(result, okRemoteResult);
    },
  );
});

test('auto surfaces the remote error when both providers fail', async () => {
  await withEnv(
    {
      EXPO_PUBLIC_CUTOUT_PROVIDER: 'auto',
      EXPO_PUBLIC_API_BASE_URL: 'http://localhost:3000',
    },
    async () => {
      const result = await generateMachineCutout(IMAGE_URI, {
        remoteProvider: async () => ({
          ok: false,
          error: {
            kind: 'network_error',
            message: 'Le backend de détourage est injoignable.',
          },
        }),
      });
      assert.equal(result.ok, false);
      if (!result.ok) {
        assert.equal(result.error.kind, 'network_error');
      }
    },
  );
});

test('auto without an API base URL fails with invalid_input after the local attempt', async () => {
  await withEnv(
    {
      EXPO_PUBLIC_CUTOUT_PROVIDER: 'auto',
      EXPO_PUBLIC_API_BASE_URL: undefined,
    },
    async () => {
      const result = await generateMachineCutout(IMAGE_URI);
      assert.equal(result.ok, false);
      if (!result.ok) {
        assert.equal(result.error.kind, 'invalid_input');
        assert.match(result.error.message, /EXPO_PUBLIC_API_BASE_URL/);
      }
    },
  );
});
