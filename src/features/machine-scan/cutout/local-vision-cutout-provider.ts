import type { CutoutResult } from './types';

/**
 * Local Apple Vision (VisionKit subject lift) cutout provider — Phase 8
 * stub. The real implementation needs a native Swift module
 * (`AppleVisionCutout`, see docs/native/APPLE_VISION_MODULE_SPEC.md)
 * that Expo Go cannot load: it requires an Expo Development Build.
 *
 * Until that module exists, this stub always reports
 * `local_provider_unavailable` so the `auto` orchestrator falls back to
 * the remote remove.bg pipeline. It must never throw and never import a
 * native module: when the module ships, availability will be probed via
 * its `isAvailable()` guard before calling `liftSubject`.
 */
export async function generateLocalVisionCutout(_input: {
  imageUri: string;
}): Promise<CutoutResult> {
  return {
    ok: false,
    error: {
      kind: 'local_provider_unavailable',
      message:
        "Le détourage local Apple Vision n'est pas disponible dans cette build (module natif absent — Expo Go).",
    },
  };
}
