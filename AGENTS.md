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

## Quality Bar

Each phase must leave the app in a working state.

A phase is done only when:

- TypeScript passes.
- Lint passes if configured.
- The app starts.
- The changed screen has usable empty, loading, error, and success states when relevant.
- Documentation is updated.
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

## Recommended Commit Flow

```bash
git status
npm run typecheck
npm run lint
git status
```

If a script does not exist, report it clearly and continue with the available checks.

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
