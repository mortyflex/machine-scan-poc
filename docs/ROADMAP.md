## Agent Runtime Migration — Claude Code

Status: DONE

Reason:

- Project workflow moved from OpenCode to Claude Code.
- OpenCode-specific config removed.
- Claude Code project memory added via `CLAUDE.md`.
- Claude Code skills added under `.claude/skills`.

Current accepted baseline before next product phase:

```txt
58edced 🎨 feat(scan): add skia cutout validation renderer
```

## Phase 6.6 — Generate real cutoutUri

Status: DONE (pending iPhone visual QA)

Delivered:

- Mobile cutout module `src/features/machine-scan/cutout/`
  (`generateMachineCutout`, typed `CutoutResult`, provider selection via
  `EXPO_PUBLIC_CUTOUT_PROVIDER=disabled | remote`, default `disabled`).
- Remote provider sends the captured photo as base64 JSON to
  `POST ${EXPO_PUBLIC_API_BASE_URL}/api/machine-cutout`, writes the
  returned transparent PNG into `machine-scan-cutouts/` (document
  directory) and returns a local `cutoutUri`.
- Local backend `server/` (`npm run server:dev`) with
  `server/cutout/` service + providers (`disabled`, `remove-bg`).
  Secrets (`REMOVE_BG_API_KEY`) stay server-side only.
- `scan-result` generates the cutout after recognition success
  (non-blocking, honest fallback on failure), passes `cutoutUri` to the
  validation stage, details, and save.
- `MachineScan.cutoutUri` persisted in SQLite (idempotent nullable-column
  migration); saved list and detail prefer `cutoutUri` over `imageUri`.

Next phase:

```txt
Phase 7 — Real AI recognition provider (backend)
```
