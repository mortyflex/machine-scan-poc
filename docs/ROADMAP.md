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

## Phase 6.6.3 — iOS cutout local file write fix

Status: DONE (pending iPhone visual QA)

QA finding:

- backend remove.bg pipeline returned HTTP 200 and valid PNG
- mobile received HTTP 200 from backend
- failure occurred while writing cutoutBase64 to local file
- fixed cutout file writing for Expo SDK 54 / expo-file-system v19

Delivered:

- New `write-cutout-file.ts` helper: explicit `file.create({ overwrite })`
  before writing (the suspected iOS failure: `File.write` on a
  non-existent file), and the payload is decoded to bytes with a pure
  base64 decoder and written via `File.write(Uint8Array)` — no reliance
  on the string `{ encoding: 'base64' }` native path.
- Tolerates a `data:...;base64,` prefix, validates base64 before touching
  the filesystem, mime-type → extension mapping (png/webp, fallback png).
- Dev logs: `local-write:start` / `directory` / `success` (with exists +
  size verification) / `error` (causeName + safe causeMessage) — never
  the base64 payload.
- Write failures propagate a safe `debugMessage` shown as `write error:`
  in the dev debug panel.
- Pure helpers unit-tested in Node (`write-cutout-file.test.ts`).

## Phase 6.6.4 — Cutout UX polish and debug cleanup

Status: DONE (pending iPhone visual QA)

QA decision:

- remote cutout pipeline is validated on iPhone
- debug panel is no longer needed in normal UI
- loading state should feel intentional and premium
- added analysis sparkle effect while cutout is being generated
- added reveal transition from photo fallback to real cutout
- added subtle sticker-style border/glow for real cutout

Delivered:

- `CutoutDebugPanel` disabled by default behind
  `SHOW_CUTOUT_DEBUG_PANEL = false` (cutout-debug.ts); verbose mobile
  success logs gated behind `CUTOUT_DEBUG_LOGS_ENABLED = false`
  (`logCutoutDebug`); error logs stay dev-only (`warnCutoutDebug`).
- Server logs trimmed to: listening / provider, POST start/end with
  duration, grouped remove.bg request/response, failures with safe
  preview.
- `CutoutAnalysisEffect`: cover photo card + subtle diagonal shimmer +
  12 slow deterministic sparkles during recognition and cutout loading.
- One-shot dust reveal in `SkiaCutoutStage`: the photo card dissolves,
  14 deterministic fragments drift away, and the cutout fades in
  (~900 ms, plays once, nothing loops after).
- Sticker-style cutout: white silhouette offsets behind the PNG alpha +
  existing glow and soft shadow.
- Fallback (no cutout), details/save/saved flows unchanged.

## Phase 6.6.5 — Premium cutout reveal staging

Status: DONE (pending iPhone visual QA)

QA finding:

- real cutout pipeline works
- cutout rendering was too small and too flat
- dust/background disappearance effect was not visible
- sticker border was invisible
- this phase enlarges the cutout, improves the premium background, adds a
  visible dust reveal, and strengthens the sticker-style outline

Delivered:

- Cutout enlarged to ~62% height / 92% width of the validation stage
  (74% height in details variant); it is the star of the screen.
- Premium background: warm vertical tint, double radial glow
  (cream + yellow core), denser/darker dotted pattern, stronger ground
  shadow.
- Visible sticker border: 12 solid-white silhouette offsets (±5/±4/±2 px)
  plus a blurred white halo hugging the PNG alpha.
- `CutoutRevealTransition`: 52 deterministic dust fragments (seeded PRNG,
  module scope) escaping radially with lift and light rotation while the
  photo card fades/scales away and the cutout scales in
  (320 ms hold + 1050 ms reveal, one-shot).
- `CutoutDisplayStage`: shared static showcase reused by scan-result
  details and saved machine detail (same stage, no reveal, no label).
- Analysis state: brighter diagonal shimmer + 16 sparkles.
- Fallback (no cutout) and save/saved flows unchanged.

## Phase 6.6.6 — Premium cutout sizing and sticker beam polish

Status: DONE (pending iPhone visual QA)

QA finding:

- real cutout works
- first polish pass improved the screen but cutout was still too small
- dust reveal was too subtle/fast
- sticker border was visible but too weak
- glow/shadow needed more depth
- validation actions needed a more premium look
- this phase increases cutout sizing, slows and strengthens the dust
  reveal, improves sticker outline, adds a subtle animated sticker beam,
  and upgrades validation actions

Delivered:

- Cutout enlarged again: 74% height / 96% width in validation, 82% height
  / 98% width in details; details stage raised to 380 px.
- Dust reveal slowed and strengthened: 300 ms hold + 1500 ms reveal,
  84 deterministic fragments, sizes ~3–7 px, travel 60–190 px with
  40–140 px lift, start opacity 0.85–1.
- Sticker border thickened to ~8 px: 16 solid-white silhouette offsets
  (±8 / ±6 / ±4 / ±3) plus a sharper white halo (blur 12, full opacity).
- New `CutoutOrbitBeam`: thin elliptical light sweep (3 px, white/pale
  yellow sweep gradient + bright head dot) orbiting the sticker every
  ~5.6 s during validation, fading in after the reveal, Skia-clock driven.
- Glow deepened (core 0.46, wide 0.72, radius +12%) and ground shadow
  strengthened (0.32, blur 26).
- Analysis sparkles made smaller (r 1.1–1.9) and twinklier (20 sparkles,
  individual speeds ~0.9–1.5 s, sharpened sine); shimmer band thinned to
  68 px at 0.30 peak.
- Premium validation actions: graphite confirm pill with yellow check
  badge and soft shadow, glassy translucent side pills with icons
  (`@expo/vector-icons`, press scale feedback, 58 px targets).
- Fallback, save/saved flows and debug-free UI unchanged.

## Phase 6.6.7 — Details premium polish and typography

Status: DONE (pending iPhone visual QA)

QA finding:

- cutout validation is mostly accepted
- details hero cutout is still too small for future gym machines
- details card needs stronger premium styling
- machine name should live inside the cutout hero card with sticker
  treatment
- app typography should move to Plus Jakarta Sans for headings and Inter
  for body copy
- added a darker contour beam alongside the existing orbit beam

Delivered:

- `CutoutOrbitBeam`: second darker graphite/golden contour (2 px,
  ~0.26–0.32 alpha) counter-rotating slightly slower (~7.4 s) inside the
  light beam — validation only.
- Details cutout enlarged to 90% height / 100% width of the hero stage;
  hero card raised to 420 px with the object nudged up for the label.
- Hero card premium: cream background (#FAF8F1), 36 px radius, hairline
  warm border, deep soft shadow (0.18 / radius 30 / y 16) on an unclipped
  wrapper.
- Machine name moved into the hero card as a sticker pill (translucent
  white, subtle −1.2° tilt, Plus Jakarta Sans ExtraBold, optional type
  subtitle in Inter); hidden from the info card to avoid duplication.
  Photo fallback keeps no sticker label.
- Info block split into three premium cards (summary + confidence pill,
  muscles, exercises with borderless mini-cards); shared `Card` upgraded
  (radius 26, soft shadow).
- Global typography: Plus Jakarta Sans Bold/ExtraBold headings, Inter
  Regular/Medium body via `@expo-google-fonts` + `expo-font`, loaded in
  the root layout (non-blocking on error), centralized in
  `src/shared/theme/typography.ts` (`appFonts`); applied to AppText
  variants, validation label/actions, camera overlay, PrimaryButton
  (now premium pill with shadow).
- Fallback, save/saved flows and debug-free UI unchanged.

## Phase 6.6.8 — Premium details page and exercise carousel

Status: DONE (pending iPhone visual QA)

QA finding:

- details page still showed a narrow gray-feeling layout and visible
  scroll indicator
- cards should use full-device premium background and shadow instead of
  borders
- machine title should use a sticker-style treatment inspired by
  `typo.png`
- details cutout should be larger for future gym machines
- exercise list should become a premium button and swipable card carousel
- destructive/back actions should be redesigned as premium buttons

Delivered:

- Scroll indicators hidden on details/saved-detail and in the exercise
  carousel.
- New `PremiumDottedBackground` (shared): warm #FAFAF7 base + subtle
  dotted grid behind the whole details/saved-detail pages.
- Cards borderless: shared `Card` now relies on relief only (radius 28,
  shadow 0.10/22/y12), light surface switched to pure white; muscle
  chips and confidence badge lost their outlines (fill-based).
- New `StickerMachineTitle`: typo.png-style title — Plus Jakarta Sans
  ExtraBold 27 in deep blue #223247 with a thick text-hugging white
  outline (12 offset copies) and soft diffuse shadow, two-line capable;
  replaces the pill label in the hero card.
- Details hero grown to 460 px; cutout destination 92% height with a
  4% horizontal bleed and a reserved title zone at the bottom.
- New `ExerciseCarousel`: graphite pill button (count badge + chevron)
  expanding into a horizontal snap carousel of premium exercise cards
  (78% width, borderless, truncated fields); replaces the plain list in
  details.
- `PrimaryButton`: borderless premium pills — new `danger` variant (pale
  red bg #FDECEC / deep red text) used by "Supprimer cette machine";
  ghost is now a soft white pill with light shadow.
- Fallback, save/saved/delete flows and debug-free UI unchanged.

Next phase:

```txt
Phase 7 — Real AI recognition provider (backend)
```
