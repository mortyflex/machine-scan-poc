# Agent Workflow Skill

Use this skill before committing.

## Rules

- Never use `git add .`.
- Use targeted `git add`.
- Do not commit logs.
- Do not commit generated artifacts.
- Do not commit temporary files.
- Do not commit caches.
- Use npm/npx commands, not Bun.
- Run checks before commit.
- Update docs after meaningful changes.
- Keep phase scope tight.
- Report files changed, checks run, and commit hash.

## Commit Checklist

```bash
git status
npm run typecheck
npm run lint
git status
```

If test script exists:

```bash
npm test
```

## Commit Format

Use:

```txt
<emoji> <type>(scope): <message>
```

Examples:

```txt
📸 feat(camera): add capture flow
🧠 feat(ai): add recognition schema
💾 feat(storage): persist scanned machines
✨ feat(scan): add reveal animation
💎 chore(app): polish machine scan poc
```

## Targeted Git Add Examples

Good:

```bash
git add app/index.tsx app/camera.tsx src/shared/components docs/ROADMAP.md
```

Bad:

```bash
git add .
```

## Final Report Format

After commit, report:

```txt
Summary:
- ...

Files changed:
- ...

Checks:
- ...

Commit:
- <hash> <message>

Notes:
- ...
```
