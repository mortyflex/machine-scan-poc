import './load-env';

import type { IncomingMessage, ServerResponse } from 'node:http';
import { createServer } from 'node:http';

import {
  generateServerCutout,
  getActiveProvider,
  getCutoutDebugInfo,
} from './cutout/cutout-service';
import type { ServerCutoutErrorKind } from './cutout/types';
import {
  getActiveRecognitionProvider,
  getRecognitionDebugInfo,
  recognizeServerMachine,
} from './recognition/recognition-service';
import type { ServerRecognitionErrorKind } from './recognition/types';

const PORT = Number(process.env.PORT ?? 3000);
const MAX_BODY_BYTES = 25 * 1024 * 1024;

const ERROR_STATUS: Record<ServerCutoutErrorKind, number> = {
  invalid_input: 400,
  cutout_disabled: 503,
  cutout_failed: 502,
  provider_error: 502,
  invalid_response: 502,
};

const RECOGNITION_ERROR_STATUS: Record<ServerRecognitionErrorKind, number> = {
  invalid_input: 400,
  recognition_disabled: 503,
  provider_error: 502,
  invalid_response: 502,
  network_error: 502,
};

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

async function readBody(req: IncomingMessage): Promise<string | null> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of req) {
    total += (chunk as Buffer).length;
    if (total > MAX_BODY_BYTES) {
      return null;
    }
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString('utf8');
}

async function handleCutout(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const startedAt = Date.now();
  console.log('[cutout-server] POST /api/machine-cutout start');

  const end = (statusCode: number, body: unknown): void => {
    console.log('[cutout-server] POST /api/machine-cutout end', {
      statusCode,
      durationMs: Date.now() - startedAt,
    });
    sendJson(res, statusCode, body);
  };

  const rawBody = await readBody(req);
  if (rawBody === null) {
    end(413, {
      error: { kind: 'invalid_input', message: 'Request body too large.' },
    });
    return;
  }

  let imageBase64 = '';
  let mimeType = 'image/jpeg';
  try {
    const parsed: unknown = JSON.parse(rawBody);
    if (typeof parsed === 'object' && parsed !== null) {
      const record = parsed as Record<string, unknown>;
      if (typeof record.imageBase64 === 'string') {
        imageBase64 = record.imageBase64;
      }
      if (typeof record.mimeType === 'string') {
        mimeType = record.mimeType;
      }
    }
  } catch {
    end(400, {
      error: { kind: 'invalid_input', message: 'Body must be valid JSON.' },
    });
    return;
  }

  const result = await generateServerCutout({ imageBase64, mimeType });

  if (!result.ok) {
    const statusCode = ERROR_STATUS[result.error.kind] ?? 502;
    console.warn('[cutout-server] cutout result', {
      ok: false,
      errorKind: result.error.kind,
      statusCode,
      durationMs: Date.now() - startedAt,
    });
    end(statusCode, {
      error: {
        kind: result.error.kind,
        message: result.error.message,
        ...(result.error.providerStatus !== undefined
          ? { providerStatus: result.error.providerStatus }
          : {}),
        ...(result.error.providerMessage
          ? { providerMessage: result.error.providerMessage }
          : {}),
      },
    });
    return;
  }

  end(200, {
    cutoutBase64: result.data.cutoutBase64,
    mimeType: result.data.mimeType,
    method: 'remote',
  });
}

async function handleRecognition(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const startedAt = Date.now();
  const provider = getActiveRecognitionProvider();
  console.log('[recognition-server] POST /api/machine-recognition start');
  console.log(`[recognition-server] provider = ${provider}`);

  const end = (statusCode: number, body: unknown): void => {
    console.log('[recognition-server] POST /api/machine-recognition end', {
      statusCode,
      durationMs: Date.now() - startedAt,
    });
    sendJson(res, statusCode, body);
  };

  const rawBody = await readBody(req);
  if (rawBody === null) {
    end(413, {
      error: { kind: 'invalid_input', message: 'Request body too large.' },
    });
    return;
  }

  let imageBase64 = '';
  let mimeType = 'image/jpeg';
  try {
    const parsed: unknown = JSON.parse(rawBody);
    if (typeof parsed === 'object' && parsed !== null) {
      const record = parsed as Record<string, unknown>;
      if (typeof record.imageBase64 === 'string') {
        imageBase64 = record.imageBase64;
      }
      if (typeof record.mimeType === 'string') {
        mimeType = record.mimeType;
      }
    }
  } catch {
    end(400, {
      error: { kind: 'invalid_input', message: 'Body must be valid JSON.' },
    });
    return;
  }

  const result = await recognizeServerMachine({ imageBase64, mimeType });

  if (!result.ok) {
    const statusCode = RECOGNITION_ERROR_STATUS[result.error.kind] ?? 502;
    console.warn('[recognition-server] result', {
      ok: false,
      errorKind: result.error.kind,
      statusCode,
      durationMs: Date.now() - startedAt,
    });
    end(statusCode, {
      error: {
        kind: result.error.kind,
        message: result.error.message,
        ...(result.error.providerStatus !== undefined
          ? { providerStatus: result.error.providerStatus }
          : {}),
        ...(result.error.providerMessage
          ? { providerMessage: result.error.providerMessage }
          : {}),
      },
    });
    return;
  }

  console.log('[recognition-server] result', {
    ok: true,
    machineType: result.data.machineType,
    confidence: result.data.confidence,
    needsConfirmation: result.data.needsConfirmation,
    durationMs: Date.now() - startedAt,
  });
  end(200, result.data);
}

function handleHealth(res: ServerResponse): void {
  sendJson(res, 200, { ok: true, provider: getActiveProvider() });
}

const server = createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = req.url ?? '';
  try {
    if (url === '/api/machine-cutout' && req.method === 'POST') {
      await handleCutout(req, res);
      return;
    }
    if (url === '/api/machine-cutout/debug' && req.method === 'GET') {
      // Safe diagnostics: reports whether the key is loaded, never its value.
      sendJson(res, 200, getCutoutDebugInfo());
      return;
    }
    if (url === '/api/machine-recognition' && req.method === 'POST') {
      await handleRecognition(req, res);
      return;
    }
    if (url === '/api/machine-recognition/debug' && req.method === 'GET') {
      // Safe diagnostics: reports whether the key is loaded, never its value.
      sendJson(res, 200, getRecognitionDebugInfo());
      return;
    }
    if (url === '/health' && req.method === 'GET') {
      handleHealth(res);
      return;
    }
    sendJson(res, 404, {
      error: { kind: 'invalid_input', message: 'Not found.' },
    });
  } catch (error) {
    console.error('[machine-scan server] unexpected error', error);
    sendJson(res, 500, {
      error: { kind: 'provider_error', message: 'Server error.' },
    });
  }
});

server.listen(PORT, () => {
  const provider = getActiveProvider();
  const recognitionProvider = getActiveRecognitionProvider();
  console.log(`[machine-scan server] listening on http://localhost:${PORT}`);
  console.log(`[machine-scan server] CUTOUT_PROVIDER = ${provider}`);
  if (provider === 'disabled') {
    console.warn(
      '[machine-scan server] cutout disabled — set CUTOUT_PROVIDER=remove-bg + REMOVE_BG_API_KEY to enable.',
    );
  }
  console.log(
    `[machine-scan server] RECOGNITION_PROVIDER = ${recognitionProvider}`,
  );
  if (recognitionProvider === 'gemini' && !process.env.GEMINI_API_KEY) {
    console.warn(
      '[machine-scan server] RECOGNITION_PROVIDER=gemini but GEMINI_API_KEY is missing — recognition will fail.',
    );
  }
});
