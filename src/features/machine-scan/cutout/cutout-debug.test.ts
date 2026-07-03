import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  CUTOUT_DEBUG_LOGS_ENABLED,
  SHOW_CUTOUT_DEBUG_PANEL,
  logCutoutDebug,
  warnCutoutDebug,
} from './cutout-debug';

test('cutout debug flags are disabled by default', () => {
  assert.equal(CUTOUT_DEBUG_LOGS_ENABLED, false);
  assert.equal(SHOW_CUTOUT_DEBUG_PANEL, false);
});

test('logCutoutDebug is silent when the flag is disabled', () => {
  const originalInfo = console.info;
  let calls = 0;
  console.info = () => {
    calls++;
  };
  try {
    logCutoutDebug('[cutout] should not appear');
  } finally {
    console.info = originalInfo;
  }
  assert.equal(calls, 0);
});

test('warnCutoutDebug is silent outside dev builds (plain Node)', () => {
  const originalWarn = console.warn;
  let calls = 0;
  console.warn = () => {
    calls++;
  };
  try {
    warnCutoutDebug('[cutout] should not appear in Node');
  } finally {
    console.warn = originalWarn;
  }
  assert.equal(calls, 0);
});
