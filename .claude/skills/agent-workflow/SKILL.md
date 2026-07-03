---
name: agent-workflow
description: Use this skill before committing, running checks, updating docs, and managing targeted git operations.
---

# Agent Workflow Skill

Use this skill before committing or reporting a phase.

## Git Rules

Never use:

```bash
git add .
git add -A
```

Use targeted adds.

Good:

```bash
git add CLAUDE.md AGENTS.md .claude/skills
git add src/features/machine-scan/cutout docs/ROADMAP.md docs/TEST_PLAN.md
```

## Required Checks

Run:

```bash
npx tsc --noEmit
npm run lint
npx tsx --test src/features/machine-scan/api/recognize.test.ts src/features/machine-scan/storage/mapping.test.ts
git status
```

If new tests are added, include them.

If an `npm test` script exists, run it.

## Report Format

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

## Manual QA Rule

Do not claim visual validation.

For visual, camera, scan, cutout, or animation changes, include:

```txt
Manual visual validation required on physical device.
```
