import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Minimal .env loader (no dependency): reads KEY=VALUE lines from the repo
 * root .env if present. Already-defined environment variables win, so
 * `CUTOUT_PROVIDER=remove-bg npm run server:dev` still overrides the file.
 */
function loadLocalEnv(): void {
  let content: string;
  try {
    content = readFileSync(resolve(process.cwd(), '.env'), 'utf8');
  } catch {
    return;
  }

  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const separator = line.indexOf('=');
    if (separator <= 0) continue;
    const key = line.slice(0, separator).trim();
    const value = line
      .slice(separator + 1)
      .trim()
      .replace(/^["']|["']$/g, '');
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadLocalEnv();
