import assert from 'node:assert/strict';
import { test } from 'node:test';

import { generateMachineCutout } from './generate-cutout';

// The provider is resolved on each call, so tests control it via env.
process.env.EXPO_PUBLIC_CUTOUT_PROVIDER = 'disabled';

test('generateMachineCutout returns invalid_input for empty imageUri', async () => {
  const result = await generateMachineCutout('');
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error.kind, 'invalid_input');
  }
});

test('generateMachineCutout returns cutout_disabled when provider is disabled', async () => {
  const result = await generateMachineCutout('file:///some-image.jpg');
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error.kind, 'cutout_disabled');
  }
});

test('generateMachineCutout returns invalid_input when remote is set without an API base URL', async () => {
  const previousProvider = process.env.EXPO_PUBLIC_CUTOUT_PROVIDER;
  const previousUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  process.env.EXPO_PUBLIC_CUTOUT_PROVIDER = 'remote';
  delete process.env.EXPO_PUBLIC_API_BASE_URL;
  try {
    const result = await generateMachineCutout('file:///some-image.jpg');
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.kind, 'invalid_input');
      assert.match(result.error.message, /EXPO_PUBLIC_API_BASE_URL/);
    }
  } finally {
    process.env.EXPO_PUBLIC_CUTOUT_PROVIDER = previousProvider;
    if (previousUrl !== undefined) {
      process.env.EXPO_PUBLIC_API_BASE_URL = previousUrl;
    }
  }
});

test('generateMachineCutout treats unknown provider values as disabled', async () => {
  const previous = process.env.EXPO_PUBLIC_CUTOUT_PROVIDER;
  process.env.EXPO_PUBLIC_CUTOUT_PROVIDER = 'not-a-real-provider';
  try {
    const result = await generateMachineCutout('file:///some-image.jpg');
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.kind, 'cutout_disabled');
    }
  } finally {
    process.env.EXPO_PUBLIC_CUTOUT_PROVIDER = previous;
  }
});