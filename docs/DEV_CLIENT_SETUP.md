# Expo Dev Client setup

Status: PREPARED (Phase 8.1) — no development build has been created
yet, no native module exists yet.

## Current state

Expo Go still works for:

- Gemini recognition (`EXPO_PUBLIC_RECOGNITION_PROVIDER=remote`)
- remove.bg cutout (`EXPO_PUBLIC_CUTOUT_PROVIDER=remote`)
- provider `auto` fallback (local-vision stub → remove.bg)
- UI tests and visual QA

A Dev Client (development build) is required only when we add the real
`AppleVisionCutout` native module
(see `docs/native/APPLE_VISION_MODULE_SPEC.md`).

## Step 1 — Install dependency

Already done in Phase 8.1: `expo-dev-client` is in `package.json`.
Nothing to install again after a fresh `npm install`.

Adding the dependency alone changes nothing at runtime in Expo Go: no
native folder is generated, no build is triggered.

## Step 2 — Keep using Expo Go for now

Daily workflow (unchanged):

```bash
npm run start:clear
```

Then scan the QR code with Expo Go on iPhone.

Remember: after changing any `EXPO_PUBLIC_` variable, restart with a
cleared cache (`start:clear`) and close/reopen Expo Go.

## Step 3 — When the Apple Vision native module is added

Once real Swift code exists in the project, Expo Go can no longer load
it. Start Metro in dev-client mode instead:

```bash
npm run start:dev-client:clear
```

## Step 4 — Create an iOS development build

Prerequisite: `app.json` has NO `ios.bundleIdentifier` yet. One must be
chosen and added before the first iOS device build (for example
`com.<owner>.machinescanpoc` — to be decided by Mohamed, do not let an
agent invent it). An EAS project (`eas init`) and Apple credentials will
also be needed at that point.

Option A — EAS cloud build:

```bash
eas build --profile development --platform ios
```

Option B — local device build (requires Xcode):

```bash
npx expo run:ios --device
```

Do NOT run either command in a preparation phase; both generate native
code (`ios/`) which must not be committed.

## Step 5 — Install the dev app on iPhone

- EAS build: use the install link / QR code shown at the end of the
  build, or Expo Orbit.
- Local build: `expo run:ios --device` installs directly on the plugged
  iPhone.

The dev app is a custom "Expo Go-like" shell that contains the
project's native modules and still loads JS from Metro.

## Step 6 — Daily workflow with the dev client

```bash
npm run start:dev-client:clear
```

Then open the installed dev app on the iPhone (not Expo Go); it
connects to the same Metro server.

## When to rebuild

Rebuild the development build only when:

- native Swift/Kotlin code changes
- native dependencies are added/removed/updated
- app config or native permissions change (`app.json` plugins,
  Info.plist entries…)

No rebuild is needed for:

- React screens
- TypeScript logic
- styling
- prompts
- provider orchestration JS

Those keep hot-reloading through Metro exactly like Expo Go.

## Summary

```txt
Expo Go            → npm run start:clear            (today)
Development build  → npm run start:dev-client:clear (future native phase)
```

Expo Go remains valid until real native Apple Vision code is added.
