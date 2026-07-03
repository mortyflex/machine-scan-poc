import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createCutoutFileName,
  decodeBase64ToBytes,
  getCutoutExtensionFromMimeType,
  stripDataUriPrefix,
  writeCutoutBase64ToFile,
} from './write-cutout-file';

test('getCutoutExtensionFromMimeType maps mime types to extensions', () => {
  assert.equal(getCutoutExtensionFromMimeType('image/png'), 'png');
  assert.equal(getCutoutExtensionFromMimeType('image/webp'), 'webp');
  assert.equal(getCutoutExtensionFromMimeType('image/jpeg'), 'png');
  assert.equal(getCutoutExtensionFromMimeType(''), 'png');
});

test('createCutoutFileName uses the mime-type extension', () => {
  assert.match(createCutoutFileName('image/png'), /^cutout-\d+-[a-z0-9]+\.png$/);
  assert.match(createCutoutFileName('image/webp'), /\.webp$/);
  assert.notEqual(createCutoutFileName('image/png'), createCutoutFileName('image/png'));
});

test('stripDataUriPrefix removes a data URI prefix and keeps raw base64', () => {
  assert.equal(
    stripDataUriPrefix('data:image/png;base64,aGVsbG8='),
    'aGVsbG8=',
  );
  assert.equal(stripDataUriPrefix('aGVsbG8='), 'aGVsbG8=');
  assert.equal(stripDataUriPrefix('  aGVsbG8=  '), 'aGVsbG8=');
});

test('decodeBase64ToBytes decodes valid base64', () => {
  const bytes = decodeBase64ToBytes('aGVsbG8=');
  assert.ok(bytes);
  assert.equal(Buffer.from(bytes!).toString('utf8'), 'hello');

  const noPadding = decodeBase64ToBytes('aGVsbG8gd29ybGQ=');
  assert.ok(noPadding);
  assert.equal(Buffer.from(noPadding!).toString('utf8'), 'hello world');
});

test('decodeBase64ToBytes matches Buffer for binary data', () => {
  const original = Buffer.from([0, 1, 2, 250, 251, 252, 253, 254, 255, 137, 80, 78, 71]);
  const decoded = decodeBase64ToBytes(original.toString('base64'));
  assert.ok(decoded);
  assert.deepEqual(Array.from(decoded!), Array.from(original));
});

test('decodeBase64ToBytes rejects invalid input', () => {
  assert.equal(decodeBase64ToBytes(''), null);
  assert.equal(decodeBase64ToBytes('not$$valid!!'), null);
  assert.equal(decodeBase64ToBytes('aGVsbG8===='), null);
  assert.equal(decodeBase64ToBytes('abc'), null);
});

test('writeCutoutBase64ToFile rejects an empty payload', async () => {
  const empty = await writeCutoutBase64ToFile({
    cutoutBase64: '',
    mimeType: 'image/png',
  });
  assert.equal(empty.ok, false);
  if (!empty.ok) {
    assert.equal(empty.error.kind, 'invalid_input');
  }

  const prefixOnly = await writeCutoutBase64ToFile({
    cutoutBase64: 'data:image/png;base64,',
    mimeType: 'image/png',
  });
  assert.equal(prefixOnly.ok, false);
  if (!prefixOnly.ok) {
    assert.equal(prefixOnly.error.kind, 'invalid_input');
  }
});

test('writeCutoutBase64ToFile rejects invalid base64 before touching the filesystem', async () => {
  const result = await writeCutoutBase64ToFile({
    cutoutBase64: 'not base64 at all!!',
    mimeType: 'image/png',
  });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error.kind, 'invalid_input');
  }
});
