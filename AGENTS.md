# AGENTS.md — Machine Scan POC

## Project Goal

Build a React Native / Expo proof of concept that lets a user photograph a gym machine, identify it, generate or receive a real object cutout when available, show a CapWords-like validation flow, save the scanned machine locally, and open it later to view possible exercises.

## Agent Runtime

This project now uses Claude Code.

Claude-specific project instructions are stored in:

- `CLAUDE.md`
- `.claude/skills/*/SKILL.md`
- `docs/*`

Do not use OpenCode-specific project files for this repository.

Removed / obsolete:

- `.opencode/`
- `opencode.json`

## Current Project State

The latest accepted commit before switching to Claude Code is:

```txt
58edced 🎨 feat(scan): add skia cutout validation renderer
```

The project currently has:

- Expo SDK 54 aligned for Expo Go.
- Expo Router under `src/app/`.
- Camera capture flow.
- Mock machine recognition.
- RecognitionResult typed API.
- Scan result screen.
- SQLite persistence.
- Saved machines list.
- Machine detail screen.
- Skia validation renderer that can display a real `cutoutUri` when available.
- No real cutout generation yet.
- No real AI provider yet.

## Critical Product Direction

The target UX is inspired by CapWords.

The desired flow is:

```txt
1. Camera capture
2. Object/machine cutout generation
3. CapWords-like validation screen
4. User validates the scan
5. Machine details screen
6. Save machine
7. Saved machines list/detail
```

The current blocker is not layout.

The current blocker is:

```txt
No real cutoutUri is generated yet.
```

Without a true `cutoutUri`, the app cannot show the isolated mouse/machine/object like CapWords.

## Reference Screens

The user has provided visual references with these names:

```txt
ecran_capture-app.png
ecran-resume-app.png
ecran-capture-capwords.png
ecran-validation-capwords.png
ecran-resume-capwords.png
```

Claude Code should inspect these files if they are present in the working directory or attached to the session.

Important comparison:

- `ecran_capture-app.png` = current app capture screen.
- `ecran-resume-app.png` = current bad result screen.
- `ecran-capture-capwords.png` = target capture style.
- `ecran-validation-capwords.png` = target validation style.
- `ecran-resume-capwords.png` = target result/detail style.

## Visual Target

The target validation screen should look like:

```txt
light background
subtle dotted pattern
real object cutout centered
soft yellow glow behind object
soft shadow under object
machine/object label below
confirm / retake / reject actions
```

The result/details screen should show:

```txt
detected machine/object visual at top
machine name
confidence
description
muscles
possible exercises
save button
```

## Absolute Cutout Rule

Never fake object segmentation with a cropped rectangle.

Do not do this:

```txt
photo squeezed into a small white rectangle
central crop pretending to be a cutout
contentFit cover as a fake solution
fake rectangle mask
pseudo object created from the original photo
```

Correct rule:

```txt
if cutoutUri exists:
  render the real transparent object cutout

else:
  show an honest fallback
  do not pretend there is a cutout
```

The next major task is to generate a real `cutoutUri`.

## Stack

- Expo SDK 54
- Expo Router
- TypeScript
- React Native
- expo-camera
- expo-sqlite
- expo-file-system
- expo-image
- React Native Skia
- React Native Reanimated
- Zod
- Zustand
- npm / npx

## Project Structure

Expo Router lives in:

```txt
src/app/
```

Not:

```txt
app/
```

Main areas:

```txt
src/features/camera/
src/features/machine-scan/
src/features/machine-scan/api/
src/features/machine-scan/components/
src/features/machine-scan/storage/
src/shared/
docs/
```

## Agent Rules

- Never use `git add .`.
- Never use `git add -A`.
- Always use targeted `git add`.
- Use npm/npx commands, not Bun.
- Do not commit `.env`.
- Do not commit logs, screenshots, temporary files, generated caches, or artifacts.
- Do not run `expo prebuild` unless explicitly requested.
- Do not add native modules unless explicitly requested.
- Keep changes small and phase-based.
- Before committing, run the required checks.
- After each phase, update docs.
- Do not claim visual validation unless Mohamed explicitly confirms it.
- Do not proceed to the next phase if manual QA reports a visual blocker.

## Human Visual QA Workflow

The agent is responsible for:

- Keeping the app runnable.
- Keeping the changed feature accessible from the UI.
- Running automated checks.
- Reporting exactly what Mohamed must test on iPhone.
- Reporting limitations honestly.

Mohamed is responsible for:

- Testing Expo Go on iPhone.
- Testing camera capture on a real device.
- Validating visual quality.
- Deciding if a phase is accepted.

The agent must always report:

```txt
Manual visual validation required on physical device.
```

for camera, scan, validation, cutout, animation, or visual phases.

## Error Handling Rules

Prefer typed result objects for expected business errors.

For UI-facing APIs, use this shape:

```ts
type FeatureResult<TData, TErrorKind extends string> =
  | {
      ok: true;
      data: TData;
    }
  | {
      ok: false;
      error: {
        kind: TErrorKind;
        message: string;
        cause?: unknown;
      };
    };
```

Use typed results for:

- missing input
- invalid AI response
- provider failure
- network failure
- storage failure
- cutout unavailable
- invalid backend response

Avoid custom `Error` classes for expected UI states.

Throwing is acceptable only for:

- programmer errors
- impossible states
- unrecoverable failures
- boundary code where the caller explicitly expects exceptions

UI-facing APIs should not require `try/catch` for normal business states.

## Cutout Architecture Rules

`cutoutUri` is the source of truth for isolated object display.

The model should distinguish:

```txt
imageUri = original captured photo
cutoutUri = transparent PNG/WebP of the object/machine
```

If `cutoutUri` exists:

- validation uses the cutout first
- details use the cutout first
- saved list/detail use the cutout first
- fallback to `imageUri` only if cutout is unavailable

If `cutoutUri` does not exist:

- show an honest fallback
- do not fake a cutout

No mobile secret keys:

```txt
EXPO_PUBLIC_API_BASE_URL is allowed
EXPO_PUBLIC_CUTOUT_PROVIDER is allowed
EXPO_PUBLIC_AI_PROVIDER is allowed
```

Forbidden:

```txt
EXPO_PUBLIC_GEMINI_API_KEY
EXPO_PUBLIC_OPENAI_API_KEY
EXPO_PUBLIC_REMOVE_BG_API_KEY
```

Secret keys belong only on the backend.

## Required Checks

Run before commit:

```bash
npx tsc --noEmit
npm run lint
npx tsx --test src/features/machine-scan/api/recognize.test.ts src/features/machine-scan/storage/mapping.test.ts
git status
```

If more test files are added, include them.

If an `npm test` script exists, run it.

## Commit Format

Use conventional commits with emoji.

Examples:

```txt
📸 feat(camera): add capture flow
🧠 feat(scan): add recognition contract and mock provider
💾 feat(storage): persist scanned machines locally
🎨 feat(scan): add skia cutout validation renderer
🖼️ feat(scan): generate real cutout uri
```

## Git Rules

Good:

```bash
git add src/features/machine-scan/cutout docs/ROADMAP.md docs/TEST_PLAN.md
git add CLAUDE.md AGENTS.md .claude/skills
```

Bad:

```bash
git add .
git add -A
```

## Phase Reporting Format

At the end of each phase, report:

```txt
Summary:
- ...

Files changed:
- ...

Automated checks:
- ...

Manual QA required:
- ...

Known limitations:
- ...

Environment variables:
- ...

Commit:
- <hash> <message>

Git status:
- ...
```
