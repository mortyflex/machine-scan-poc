# Apple Vision local cutout

Goal:

- reduce remove.bg API usage (each remote cutout costs credits)
- try local iOS subject lift (Apple Vision / VisionKit) first
- fallback to remove.bg when the local provider is unavailable or fails

Reference: https://developer.apple.com/documentation/visionkit

## Constraints

- Apple Vision / VisionKit is iOS only.
- Subject lift requires native Swift code (no JS-only path).
- Expo Go cannot load new custom native code: the local provider is
  ALWAYS unavailable in Expo Go.
- A real integration requires an Expo Development Build (expo-dev-client)
  or a native iOS build.
- remove.bg stays as the remote fallback and must keep working.
- Android keeps using the remote remove.bg provider (no local provider
  planned for Android in this phase).

## Dev Client requirement

A real Apple Vision provider requires a development build with
`expo-dev-client`.

Phase 8.1 only prepares the project: `expo-dev-client` dependency,
`start:dev-client*` npm scripts, `eas.json` development profiles and
`docs/DEV_CLIENT_SETUP.md`. It does not implement Swift and does not
generate native folders (`ios/` / `android/` stay uncommitted).

Until the native module exists, keep using Expo Go
(`npm run start:clear`); see `docs/DEV_CLIENT_SETUP.md` for the full
workflow.

## Proposed pipeline

1. `isSportMachine=false` → skip cutout entirely (Phase 7.3, unchanged).
2. iOS local provider available → Apple Vision subject lift, local PNG.
3. Local provider unavailable / fails → remote remove.bg backend.
4. `cutoutUri` is written and consumed exactly like today
   (validation stage → details → save → saved list/detail).

## Mobile provider selection (Phase 8, shipped)

`EXPO_PUBLIC_CUTOUT_PROVIDER` now supports four values
(`src/features/machine-scan/cutout/cutout-config.ts`):

| Value          | Behavior                                                        |
| -------------- | --------------------------------------------------------------- |
| `disabled`     | No cutout, honest photo fallback (default).                     |
| `remote`       | Backend `/api/machine-cutout` (remove.bg) — unchanged behavior. |
| `local-vision` | Local Apple Vision ONLY; typed error when unavailable.          |
| `auto`         | Try local Apple Vision first, fall back to remote on failure.   |

Unknown/missing values still resolve to `disabled`.

Current state of the local provider
(`src/features/machine-scan/cutout/local-vision-cutout-provider.ts`):
it is a safe stub that always returns the typed error
`local_provider_unavailable` and never crashes. So today:

- in Expo Go, `local-vision` → honest fallback, no remote call;
- in Expo Go, `auto` → immediate fallback to the remote remove.bg
  pipeline (identical UX to `remote`).

The `auto` orchestration lives in
`src/features/machine-scan/cutout/generate-cutout.ts`; both providers are
injectable for Node unit tests.

## Future native module JS contract

The real provider will wrap a native module named `AppleVisionCutout`
(spec: `docs/native/APPLE_VISION_MODULE_SPEC.md`):

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

The JS provider (`generateLocalVisionCutout`) will then:

1. guard-import the module (never a hard import that breaks Expo Go);
2. call `isAvailable()` — `false` → `local_provider_unavailable`;
3. call `liftSubject(imageUri)`;
4. write the transparent PNG locally via `writeCutoutBase64ToFile`
   (same durable `machine-scan-cutouts/` folder as the remote path);
5. return `{ ok: true, data: { cutoutUri, method: 'local-vision' } }`.

Error mapping: `not_available` → `local_provider_unavailable` (auto
falls back to remote); `no_subject` / `processing_failed` → also fall
back to remote in `auto` mode, typed error in strict `local-vision`
mode.

## Rollout plan

1. Phase 8 (done): multi-provider config, safe stub, `auto` fallback,
   docs, tests. No native code.
2. Build the `AppleVisionCutout` Swift module behind an Expo Development
   Build (explicit future phase; requires `expo-dev-client`).
3. QA on device: `auto` uses the local cutout, remove.bg calls drop;
   pull the plug on the backend to verify local-only still works.
4. Keep `remote` as the supported mode for Android and Expo Go.
