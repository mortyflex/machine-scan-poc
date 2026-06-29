# CLAUDE.md — Agent Instructions

You are working on a React Native / Expo POC.

The app lets users scan gym machines with the camera, identify the machine using a vision AI backend, show a premium reveal animation, save the machine locally, and open it later to view possible exercises.

## Important User Preferences

- Use `touch <path>` when asking the user to create files manually.
- Use raw Markdown in fenced code blocks for prompts and long copy/paste content.
- Never use `git add .`.
- Commit only targeted files.
- Exclude logs, generated artifacts, caches, and temporary files.
- Keep phases small.
- Update docs after meaningful changes.
- Use npm/npx commands, not Bun.

## Development Principles

- Build the feature vertically.
- Prefer working simple flows over incomplete abstractions.
- Mock external AI first, then integrate real providers.
- Validate all AI responses with Zod.
- Keep AI provider replaceable.
- Keep the visual effect independent from the AI result.
- Keep storage independent from the UI.
- Keep camera capture independent from AI recognition.

## POC Architecture

Main flows:

1. Home screen.
2. Camera capture.
3. Machine recognition.
4. Reveal animation.
5. Machine result.
6. Save machine.
7. Saved machines list.
8. Machine detail.

## Expected Commands

Use npm/npx.

Common commands:

```bash
npm start
npm run lint
npm run typecheck
npm test
```

If a script does not exist, add it only when needed and document it.

## Done Criteria

Before committing:

```bash
git status
npm run typecheck
npm run lint
```

If `npm test` exists:

```bash
npm test
```

Then commit with targeted files only.

Example:

```bash
git add src/features/machine-scan docs/ROADMAP.md docs/TECHNICAL_ARCHITECTURE.md
git commit -m "🧠 feat(scan): add machine recognition types"
```

## Report Format

At the end of each phase, report:

- Summary of what changed.
- Files changed.
- Checks run.
- Check results.
- Commit hash.
- Anything intentionally not done.
