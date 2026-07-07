# Apple Vision native module spec

Status: SPEC ONLY — no native module exists yet. Do not add `ios/` or
any native code without an explicit request (Expo Go must keep working).

Module name:

- `AppleVisionCutout`

Platforms:

- iOS only (Apple Vision / VisionKit subject lift).
- Android: not planned; Android keeps the remote remove.bg provider.

Expo:

- requires an Expo Development Build (`expo-dev-client`) or a native
  iOS build
- NOT supported in Expo Go (custom native code cannot be loaded)
- the JS side must guard-import the module and degrade to
  `local_provider_unavailable` when it is absent

## Dev Client requirement

A real Apple Vision provider requires a development build with
`expo-dev-client`.

Phase 8.1 only prepares the project (dependency, scripts, `eas.json`,
`docs/DEV_CLIENT_SETUP.md`). It does not implement Swift and does not
generate native folders. A `ios.bundleIdentifier` must be chosen in
`app.json` before the first iOS device build.

## JS API

```ts
type AppleVisionCutoutModule = {
  isAvailable(): Promise<boolean>;
  liftSubject(imageUri: string): Promise<{
    ok: true;
    cutoutBase64: string;
    imageType: 'image/png';
  } | {
    ok: false;
    error: {
      kind: 'not_available' | 'no_subject' | 'processing_failed';
      message: string;
    };
  }>;
};
```

- `isAvailable()`: cheap capability probe — OS version supports subject
  lift AND the module is loaded. Never throws.
- `liftSubject(imageUri)`: runs the subject lift on the local photo and
  returns a transparent PNG (base64, or alternatively a temp `file://`
  path if payload size becomes a concern).

## Native implementation notes

- Swift, Expo Modules API preferred.
- VisionKit / Vision subject lift (`ImageAnalyzer` /
  `VNGenerateForegroundInstanceMaskRequest` family, iOS 17+).
- Output: PNG with transparent background (subject only).
- Return base64 PNG or write to a temp file and return its path.
- Must not block the main thread (analysis runs on a background queue).
- Must handle "no subject found" → `{ ok: false, kind: 'no_subject' }`.
- Must handle unsupported OS/device → `{ ok: false, kind: 'not_available' }`
  (and `isAvailable()` returns `false`).
- Must handle unreadable/corrupt input → `processing_failed`.
- Never log image payloads; no network access; no secrets involved.

## JS integration (once the module exists)

`src/features/machine-scan/cutout/local-vision-cutout-provider.ts`
replaces its stub body with:

1. guarded module lookup (missing module → `local_provider_unavailable`);
2. `isAvailable()` check;
3. `liftSubject(imageUri)`;
4. `writeCutoutBase64ToFile({ cutoutBase64, mimeType: 'image/png' })`;
5. `{ ok: true, data: { cutoutUri, method: 'local-vision' } }`.

The orchestrator (`generate-cutout.ts`) and the `auto` fallback are
already in place and must not need changes.
