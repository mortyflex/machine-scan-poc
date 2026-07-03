# CLAUDE.md — Machine Scan POC

You are working on `machine-scan-poc`, a React Native / Expo proof of concept.

The user is Mohamed.

## Runtime

This repository is now driven by Claude Code.

Read these files before any phase:

- `AGENTS.md`
- `docs/PRODUCT_SPEC.md`
- `docs/TECHNICAL_ARCHITECTURE.md`
- `docs/AI_CONTRACT.md`
- `docs/UI_EFFECT_SPEC.md`
- `docs/ROADMAP.md`
- `docs/TEST_PLAN.md`

Use skills from:

- `.claude/skills/machine-scan/SKILL.md`
- `.claude/skills/mobile-ui/SKILL.md`
- `.claude/skills/agent-workflow/SKILL.md`
- `.claude/skills/skia-cutout/SKILL.md`

## Current Accepted Baseline

The latest accepted commit before switching to Claude Code is:

```txt
58edced 🎨 feat(scan): add skia cutout validation renderer
```

Do not assume later OpenCode experiments exist unless they are present in the working tree.

## Current Product Problem

The app has a Skia validation renderer, but it still does not generate a real `cutoutUri`.

The desired CapWords-like UX requires:

```txt
photo capture
→ real object cutout generation
→ validation screen with isolated object
→ user confirms
→ detail screen with object + machine info
→ save
```

The next important phase is not more layout tuning.

The next important phase is:

```txt
Generate a real cutoutUri.
```

## Core Visual Rule

Never fake a cutout with a rectangular crop.

Bad:

```txt
small squeezed photo in a white card
contentFit cover as fake object extraction
rounded rectangle crop pretending to be a cutout
photo-card presented as object cutout
```

Good:

```txt
if cutoutUri exists:
  render transparent object cutout with Skia glow/shadow

else:
  show honest fallback
  clearly do not pretend there is a cutout
```

## Reference Screens

If available, inspect:

```txt
ecran_capture-app.png
ecran-resume-app.png
ecran-capture-capwords.png
ecran-validation-capwords.png
ecran-resume-capwords.png
```

Target:

- capture screen like `ecran-capture-capwords.png`
- validation screen like `ecran-validation-capwords.png`
- result/details screen like `ecran-resume-capwords.png`

Current bad states:

- `ecran_capture-app.png`
- `ecran-resume-app.png`

## Tech Stack

- Expo SDK 54
- Expo Router under `src/app/`
- TypeScript
- React Native
- expo-camera
- expo-sqlite
- expo-file-system
- expo-image
- React Native Skia
- React Native Reanimated
- Zod
- npm / npx

## Do Not Use

- Bun
- `git add .`
- `git add -A`
- `expo prebuild` unless explicitly requested
- native modules unless explicitly requested
- secret keys in mobile code
- `.env` commits

## Commands

Use:

```bash
npx tsc --noEmit
npm run lint
npx tsx --test src/features/machine-scan/api/recognize.test.ts src/features/machine-scan/storage/mapping.test.ts
```

If new cutout tests are added, include them.

## Expected Agent Behavior

- Make small phase-based changes.
- Keep the app runnable.
- Keep mock/default modes working.
- Keep Expo Go compatibility.
- Update docs after meaningful changes.
- Report manual iPhone QA needed.
- Never claim visual validation.

## Current Useful Commits

```txt
5adb556 🏗️ feat(app): add navigation shell
ba4ff3a 📸 feat(camera): add photo capture flow
38cdba9 🧠 feat(scan): add recognition contract and mock provider
786015c ♻️ refactor(scan): simplify recognition result handling
350ff88 🧾 feat(scan): display machine recognition result
15843d5 💾 feat(storage): persist scanned machines locally
b607eb6 ✨ feat(scan): add premium reveal animation
66711b0 🎨 polish(scan): tune capwords reveal effect
a831a8b 🎨 polish(scan): replace fake cutout with honest reveal
003a055 🎨 polish(scan): align capture and validation flow with capwords
58edced 🎨 feat(scan): add skia cutout validation renderer
```

If the working branch only contains commits up to `58edced`, treat that as the baseline.
