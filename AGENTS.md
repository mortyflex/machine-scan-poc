# AGENTS.md — Machine Scan POC

## Project Goal

Build a React Native / Expo proof of concept that lets a user photograph a gym machine, identify it with a vision AI model, reveal it with a premium CapWords-like animation, save it locally, and open the machine later to view possible exercises.

## Agent Runtime

This project uses OpenCode.

Project-specific instructions are stored in:

- `AGENTS.md`
- `opencode.json`
- `.opencode/skills/*/SKILL.md`
- `docs/*`

Do not use Claude-specific project files for this repository.

## Stack

- Expo
- Expo Router
- TypeScript
- React Native
- expo-camera
- expo-sqlite
- React Native Skia
- React Native Reanimated
- Zod
- Zustand
- npm / npx

## Product Scope

The POC must support:

1. Camera capture.
2. AI recognition through a replaceable provider adapter.
3. Strict JSON response validation.
4. Machine result screen.
5. Saved machines list.
6. Machine detail screen.
7. Premium reveal animation.
8. Local persistence.
9. Mock mode for offline development.

## Non-goals for POC

Do not implement:

- Authentication.
- Payments.
- Full workout planning.
- Medical advice.
- Real-time camera frame processing.
- Perfect segmentation.
- Custom machine-learning training.
- Native iOS/Android modules unless explicitly requested.

## Agent Rules

- Never use `git add .`.
- Always use targeted `git add`.
- Do not commit logs, screenshots, temporary files, generated caches, or `.opencode` runtime artifacts unless explicitly requested.
- Keep changes small and phase-based.
- Before committing, run available checks.
- After each phase, update `docs/ROADMAP.md`.
- If a technical decision is made, update `docs/TECHNICAL_ARCHITECTURE.md`.
- If the AI contract changes, update `docs/AI_CONTRACT.md`.
- If the UI effect changes, update `docs/UI_EFFECT_SPEC.md`.
- Use npm/npx commands, not Bun.
- Keep the app visually testable after every phase.
- Do not claim full visual validation unless the human owner explicitly confirms it.

## Human Visual QA Workflow

The app must remain visually testable after every phase.

The agent is responsible for:

- Keeping the app in a runnable state.
- Making the changed feature accessible from the UI.
- Avoiding broken navigation.
- Running available automated checks.
- Reporting what should be tested manually.
- Reporting known visual risks or limitations.
- Keeping camera, scan, save, and detail flows reachable from the app UI when those features exist.

The human owner is responsible for:

- Opening the app with Expo Go on iPhone.
- Testing camera capture on a real device.
- Testing simulator behavior on Mac when useful.
- Validating the visual quality of screens and animations.
- Deciding whether the phase is visually accepted.

The agent must not claim that a visual flow is fully validated unless the human owner explicitly confirms it.

After each phase, the agent must report:

- Screens changed.
- Flow that should be tested manually.
- Suggested iPhone checks.
- Suggested simulator checks.
- Known limitations.
- Automated checks run.

For camera-related phases, the agent must clearly state:

```txt
Manual iPhone validation required.
```

For animation-related phases, the agent must clearly state:

```txt
Manual visual validation required on physical device.
```

## Quality Bar

Each phase must leave the app in a working state.

A phase is done only when:

- TypeScript passes, if a typecheck script exists.
- Lint passes, if a lint script exists.
- The app starts.
- The changed feature is reachable from the UI.
- The changed screen has usable empty, loading, error, and success states when relevant.
- Documentation is updated.
- The agent reports manual visual checks for the human owner.
- `git status` is clean after commit.

## Commit Format

Use conventional commits with emoji.

Examples:

- `🏗️ chore(app): initialize machine scan poc`
- `📸 feat(camera): add capture flow`
- `🧠 feat(ai): add machine recognition adapter`
- `💾 feat(storage): persist scanned machines`
- `✨ feat(scan): add reveal animation`
- `🧪 test(scan): cover machine response validation`
- `💎 chore(app): polish machine scan poc`

## Recommended Commit Flow

```bash
git status
npm run typecheck
npm run lint
git status
```

If a script does not exist, report it clearly and continue with the available checks.

If a test script exists, run:

```bash
npm test
```

Then add targeted files only:

```bash
git add <exact-file-1> <exact-file-2> <exact-folder-if-safe>
git commit -m "<emoji> <type>(<scope>): <message>"
```

Never use:

```bash
git add .
```

## OpenCode Skills

Project skills live in:

```txt
.opencode/skills/machine-scan/SKILL.md
.opencode/skills/mobile-ui/SKILL.md
.opencode/skills/agent-workflow/SKILL.md
```

Use them when relevant:

- `machine-scan`: AI recognition, schema, exercise data, scan flow.
- `mobile-ui`: screens, mobile-first UI, reveal animation.
- `agent-workflow`: commits, checks, docs, targeted git operations.

## Phase Reporting Format

At the end of each phase, the agent must report:

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

Commit:
- <hash> <message>
```

## Phase Rules

### Phase 1 — App Shell

Expected outcome:

- Home screen works.
- Camera route opens.
- Saved machines route opens.
- Machine detail placeholder exists.
- Shared UI components exist.

Manual QA required:

- Open app in simulator or Expo Go.
- Check navigation.
- Check mobile layout.

### Phase 2 — Camera Capture

Expected outcome:

- Camera permission flow works.
- Capture button works.
- Captured image URI reaches scan result screen.
- Permission denied state is usable.

Manual QA required:

```txt
Manual iPhone validation required.
```

The simulator must not be treated as sufficient for camera validation.

### Phase 3 — Machine Recognition Contract

Expected outcome:

- Mock provider returns a valid machine result.
- Invalid response is rejected.
- Low confidence state is represented.
- Recognition code is independent from UI.

Manual QA required:

- None mandatory beyond checking that the app still starts.
- Human can verify mocked data later in scan result.

### Phase 4 — Scan Result

Expected outcome:

- Scan result screen shows captured image.
- Mock result appears.
- Exercises are readable.
- Error and loading states exist.

Manual QA required:

- Test captured photo to scan-result flow on iPhone.
- Check that machine result is readable.
- Check loading/error states if exposed.

### Phase 5 — Local Persistence

Expected outcome:

- User can save a machine.
- Saved machine appears in list.
- User can open machine detail.
- Data persists after restart.

Manual QA required:

- Save a scanned machine on iPhone.
- Restart app.
- Confirm saved machine still appears.
- Open detail screen.

### Phase 6 — Reveal Effect V1

Expected outcome:

- Reveal animation appears after capture.
- Result card appears after animation.
- Effect does not block success/error states.
- App remains responsive.

Manual QA required:

```txt
Manual visual validation required on physical device.
```

The agent must not claim that the animation feels premium unless the human owner confirms it.

### Phase 7 — Real AI Provider

Expected outcome:

- Mock provider still works.
- Remote provider can be enabled.
- API keys are not exposed in mobile code.
- Invalid AI responses are rejected.
- Remote error state is usable.

Manual QA required:

- Test mock mode.
- Test remote mode if configured by the human owner.
- Confirm no API key is exposed in mobile code.

### Phase 8 — Polish

Expected outcome:

- Full flow is presentable.
- No obvious broken screen remains.
- Docs are up to date.
- Repo is clean after commit.

Manual QA required:

- Full iPhone flow.
- Optional simulator check.
- Human owner decides if the POC is visually accepted.

## Safety and Fitness Rules

The app can explain machine usage.

The app must not:

- Diagnose injuries.
- Prescribe exact loads.
- Replace medical or coaching advice.
- Recommend dangerous form.
- Invent exercises when the machine is unclear.

When confidence is low, the app must show uncertainty instead of pretending to be sure.

## AI Rules

- AI responses must be validated with Zod.
- Raw AI JSON must never be trusted directly.
- The recognition provider must stay replaceable.
- Mock mode must remain available.
- No API key should be committed.
- No API key should be exposed in mobile code.
- If the image is unclear, return a low-confidence or confirmation-required result.

## Error Handling Rules

Prefer typed result objects for expected business errors.

For feature APIs used by UI components, prefer this shape:

````ts
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

## UI Rules

- Mobile-first.
- Camera-first.
- No generic AI slop.
- Avoid overloaded screens.
- Use readable spacing.
- Use large touch targets.
- Keep the app usable in a real gym context.
- Always handle loading, empty, error, and success states.

## Git Rules

Never use:

```bash
git add .
````

Use targeted adds only.

Good examples:

```bash
git add AGENTS.md
git add app/index.tsx app/camera.tsx
git add src/features/machine-scan docs/ROADMAP.md docs/TEST_PLAN.md
git add .opencode/skills/machine-scan/SKILL.md
```

Bad examples:

```bash
git add .
git add -A
```

Before committing, always check:

```bash
git status
```

After committing, report the commit hash.
