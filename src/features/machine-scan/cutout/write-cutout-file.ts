import { logCutoutDebug, warnCutoutDebug } from './cutout-debug';

export type WriteCutoutFileResult =
  | {
      ok: true;
      data: {
        cutoutUri: string;
      };
    }
  | {
      ok: false;
      error: {
        kind: 'file_write_failed' | 'invalid_input';
        message: string;
        cause?: unknown;
      };
    };

const CUTOUTS_DIRECTORY = 'machine-scan-cutouts';

export function getCutoutExtensionFromMimeType(
  mimeType: string,
): 'png' | 'webp' {
  return mimeType === 'image/webp' ? 'webp' : 'png';
}

export function createCutoutFileName(mimeType: string): string {
  const random = Math.random().toString(36).slice(2);
  return `cutout-${Date.now()}-${random}.${getCutoutExtensionFromMimeType(mimeType)}`;
}

/**
 * The backend sends raw base64, but stay tolerant to a
 * `data:image/png;base64,...` URI: only the payload must be written.
 */
export function stripDataUriPrefix(value: string): string {
  const marker = 'base64,';
  const index = value.indexOf(marker);
  return (index === -1 ? value : value.slice(index + marker.length)).trim();
}

const BASE64_LOOKUP = (() => {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Int16Array(128).fill(-1);
  for (let i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
  }
  return lookup;
})();

/**
 * Pure base64 decoder (no atob dependency): writing decoded bytes through
 * `File.write(Uint8Array)` avoids any native quirk of the string
 * `{ encoding: 'base64' }` write path, and invalid payloads are caught
 * before touching the filesystem. Returns null when the input is not
 * valid base64.
 */
export function decodeBase64ToBytes(base64: string): Uint8Array | null {
  const clean = base64.replace(/\s+/g, '');
  if (clean.length === 0) return null;

  let end = clean.length;
  let padding = 0;
  while (end > 0 && clean[end - 1] === '=') {
    padding++;
    end--;
  }
  if (padding > 2 || (end + padding) % 4 !== 0) return null;

  const bytes = new Uint8Array(Math.floor((end * 6) / 8));
  let bits = 0;
  let bitCount = 0;
  let byteIndex = 0;
  for (let i = 0; i < end; i++) {
    const code = clean.charCodeAt(i);
    const value = code < 128 ? BASE64_LOOKUP[code] : -1;
    if (value === -1) return null;
    bits = (bits << 6) | value;
    bitCount += 6;
    if (bitCount >= 8) {
      bitCount -= 8;
      bytes[byteIndex++] = (bits >> bitCount) & 0xff;
    }
  }
  return bytes;
}

/**
 * Writes a cutout base64 payload to a durable local file
 * (`machine-scan-cutouts/` under the document directory) and returns a
 * `file://` URI usable by Skia / expo-image. Never throws for expected
 * failures. expo-file-system is lazy-imported so the pure helpers above
 * stay testable in plain Node.
 */
export async function writeCutoutBase64ToFile(params: {
  cutoutBase64: string;
  mimeType: string;
}): Promise<WriteCutoutFileResult> {
  const rawBase64 = stripDataUriPrefix(params.cutoutBase64 ?? '');
  if (!rawBase64) {
    return {
      ok: false,
      error: {
        kind: 'invalid_input',
        message: 'Aucune donnée cutout à écrire.',
      },
    };
  }

  logCutoutDebug('[cutout] local-write:start', {
    mimeType: params.mimeType,
    base64Length: rawBase64.length,
  });

  const bytes = decodeBase64ToBytes(rawBase64);
  if (!bytes || bytes.length === 0) {
    warnCutoutDebug('[cutout] local-write:error', {
      message: 'Le contenu base64 du cutout est invalide.',
      causeName: 'InvalidBase64',
      causeMessage: `base64Length=${rawBase64.length}`,
    });
    return {
      ok: false,
      error: {
        kind: 'invalid_input',
        message: 'Le contenu base64 du cutout est invalide.',
      },
    };
  }

  try {
    const { Directory, File, Paths } = await import('expo-file-system');

    const directory = new Directory(Paths.document, CUTOUTS_DIRECTORY);
    if (!directory.exists) {
      directory.create({ intermediates: true });
    }
    logCutoutDebug('[cutout] local-write:directory', {
      directoryUri: directory.uri,
      exists: directory.exists,
    });

    const file = new File(directory, createCutoutFileName(params.mimeType));
    // Explicit create: File.write on a non-existent file is the suspected
    // iOS failure; create({ overwrite }) guarantees the target exists.
    file.create({ intermediates: true, overwrite: true });
    file.write(bytes);

    let exists: boolean | undefined;
    let size: number | undefined;
    try {
      exists = file.exists;
      size = file.size;
    } catch {
      // Verification is best-effort only; never block a successful write.
    }
    logCutoutDebug('[cutout] local-write:success', {
      cutoutUri: file.uri,
      exists,
      size,
      expectedSize: bytes.length,
    });

    return { ok: true, data: { cutoutUri: file.uri } };
  } catch (error) {
    const causeName = error instanceof Error ? error.name : typeof error;
    const causeMessage = (
      error instanceof Error ? error.message : String(error)
    ).slice(0, 300);
    warnCutoutDebug('[cutout] local-write:error', {
      message: "L'écriture du fichier cutout a échoué.",
      causeName,
      causeMessage,
    });
    return {
      ok: false,
      error: {
        kind: 'file_write_failed',
        message: `${causeName}: ${causeMessage}`,
        cause: error,
      },
    };
  }
}
