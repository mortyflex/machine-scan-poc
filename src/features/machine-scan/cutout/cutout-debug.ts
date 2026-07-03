import { isDevBuild } from './cutout-config';

/**
 * Verbose success/progress logs for the cutout pipeline. Off by default:
 * they were needed to validate the pipeline (Phases 6.6.1–6.6.3) and only
 * matter when actively debugging. Flip to true locally when needed.
 */
export const CUTOUT_DEBUG_LOGS_ENABLED: boolean = false;

/**
 * On-screen cutout debug panel. Off by default now that the remote
 * pipeline is validated on device; flip to true locally to diagnose
 * env/provider issues again.
 */
export const SHOW_CUTOUT_DEBUG_PANEL: boolean = false;

/** Verbose progress log: dev build + explicit flag only. */
export function logCutoutDebug(...args: unknown[]): void {
  if (isDevBuild && CUTOUT_DEBUG_LOGS_ENABLED) {
    console.info(...args);
  }
}

/** Error log: always visible in dev builds, silent in production. */
export function warnCutoutDebug(...args: unknown[]): void {
  if (isDevBuild) {
    console.warn(...args);
  }
}
