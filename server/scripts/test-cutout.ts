import '../load-env';

import { readFileSync, writeFileSync } from 'node:fs';
import { extname, resolve } from 'node:path';

import {
  generateServerCutout,
  getCutoutDebugInfo,
} from '../cutout/cutout-service';

/**
 * Local cutout pipeline test, without the app:
 *
 *   npx tsx server/scripts/test-cutout.ts ./path/to/image.jpg
 *
 * Reads the image, calls the server cutout service directly (same code as
 * POST /api/machine-cutout), prints a safe diagnostic (never the API key),
 * and writes tmp-cutout-test.png on success (git-ignored).
 */
function guessMimeType(path: string): string {
  const ext = extname(path).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.heic') return 'image/heic';
  return 'image/jpeg';
}

async function main(): Promise<void> {
  const imagePath = process.argv[2];
  if (!imagePath) {
    console.error('Usage: npx tsx server/scripts/test-cutout.ts <image-path>');
    process.exitCode = 1;
    return;
  }

  const debug = getCutoutDebugInfo();
  console.log('[test-cutout] config', debug);

  let imageBase64: string;
  try {
    imageBase64 = readFileSync(resolve(imagePath)).toString('base64');
  } catch (error) {
    console.error('[test-cutout] cannot read image:', imagePath, error);
    process.exitCode = 1;
    return;
  }

  const mimeType = guessMimeType(imagePath);
  console.log('[test-cutout] input', {
    mimeType,
    imageBase64Length: imageBase64.length,
  });

  const startedAt = Date.now();
  const result = await generateServerCutout({ imageBase64, mimeType });
  const durationMs = Date.now() - startedAt;

  if (!result.ok) {
    console.error('[test-cutout] FAILED', {
      durationMs,
      kind: result.error.kind,
      message: result.error.message,
      providerStatus: result.error.providerStatus,
      providerMessage: result.error.providerMessage,
    });
    process.exitCode = 1;
    return;
  }

  const outputPath = resolve('tmp-cutout-test.png');
  writeFileSync(outputPath, Buffer.from(result.data.cutoutBase64, 'base64'));
  console.log('[test-cutout] SUCCESS', {
    durationMs,
    outputBase64Length: result.data.cutoutBase64.length,
    mimeType: result.data.mimeType,
    writtenTo: outputPath,
  });
}

void main();
