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

## Phase 6.6.1 — Cutout mobile trigger debug and fallback display

Status: DONE (pending iPhone visual QA)

QA finding:

- backend `/health` was reachable from iPhone
- no `POST /api/machine-cutout` appeared during scan
- issue is on mobile trigger/env/config side, not remove.bg
- added dev-only cutout debug panel and logs
- improved no-cutout fallback from narrow vertical photo to wide
  cover-style photo card

Delivered:

- `cutout-config.ts`: centralized `getCutoutConfig()` (provider +
  apiBaseUrl + raw values for debug).
- `__DEV__`-only logs in `generateMachineCutout` and the remote provider
  (start / disabled / request / response / error — never the base64
  payload or any secret).
- `CutoutDebugPanel` (dev-only) on the cutout loading + validation
  screens: provider / api / status / error / visual mode + a
  `Relancer le détourage` retry button.
- `remote` without `EXPO_PUBLIC_API_BASE_URL` → clear `invalid_input`
  (`Missing EXPO_PUBLIC_API_BASE_URL`) instead of a silent localhost
  default.
- Server logs `[cutout-server] POST /api/machine-cutout` on each request.
- Fallback photo card now fills wide (cover crop, radius 30) — still
  clearly labeled `Détourage indisponible`, never presented as a cutout.

## Phase 6.6.2 — Backend cutout diagnostics and no-cutout visual consistency

Status: DONE (pending iPhone visual QA)

QA finding:

- mobile app reads remote env correctly
- mobile app reaches backend (`POST /api/machine-cutout` logged)
- backend did not expose enough safe diagnostics for remove.bg failures
- loading state still displayed a narrow vertical photo inside a white card
- added backend provider logs, safe debug endpoint, provider status
  propagation, and shared wide cover-style no-cutout photo fallback

Delivered:

- Backend request lifecycle logs (start / parsed / result / end with
  durations) and detailed remove.bg logs (hasApiKey, input size, response
  status/content-type, ≤300-char safe error preview — never the key or
  the base64 payload).
- Error envelope now carries `providerStatus` / `providerMessage`,
  propagated through the mobile typed error into the dev debug panel.
- `GET /api/machine-cutout/debug`: provider, `hasRemoveBgApiKey` (boolean
  only), node version — never the key value.
- `server/scripts/test-cutout.ts`: test the cutout service directly with
  a local image (`npx tsx server/scripts/test-cutout.ts ./photo.jpg`).
- Server tests (`server/cutout/cutout-service.test.ts`): disabled /
  invalid input / missing key / debug payload never exposes the key.
- Shared `PhotoFallbackCard` (cover-style, wide, premium card) used by
  the recognition/cutout loading stages, the details fallback, and the
  saved detail fallback; the Skia validation fallback was already cover.

Next phase:

```txt
Phase 7 — Real AI recognition provider (backend)
```
