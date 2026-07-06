# Test Plan — Machine Scan POC

## Manual Checks

### Home

- User can open home screen.
- User can navigate to camera.
- User can navigate to saved machines.
- UI is readable on mobile.

### Camera (Phase 6.4 — CapWords alignment)

- Permission request appears.
- Denied permission state is understandable.
- Camera preview is **full-screen** (no black side bars, no horizontal
  padding compressing the preview).
- A scan frame with 4 white corner brackets is visible, with the
  instruction `Place la machine dans le cadre`.
- The circular capture button is at the bottom; `Annuler` (top-left) goes
  home.
- Capture button takes a photo; capture in progress shows a spinner and
  disables the button.
- Captured image URI is passed to scan-result.
- Capture / mount error state is understandable.
- Controls are overlay only and do not compress the camera preview.

Phase 2 detail:

- Permission loading state ("Vérification des permissions caméra…") appears
  before the system prompt.
- Capture button is disabled until `onCameraReady` fires.
- Capture in progress shows "Capture…" and disables the button.
- Denied permanently (`canAskAgain === false`) shows a settings-focused
  message; pressing "Redemander la permission" re-requests.
- `onMountError` (camera unavailable) sets a capture error card.
- Navigation after capture uses `replace` so back does not reopen the camera.
- Captured image is temporary (cache URI); persistence handled in Phase 5.
- Simulator: camera may be unavailable — verify the error state shows.

### Scan Result (Phase 2)

- Captured photo is visible when `imageUri` is present.
- "Image manquante" state appears when navigated to without `imageUri`.
- A placeholder card indicates IA recognition comes in Phase 3/4.

### Recognition

- Mock provider returns valid result.
- Invalid provider response shows error.
- Low confidence result shows confirmation state.
- Non-machine result does not create fake exercises.
- Missing image URI shows error state.

Phase 3 detail (automated, no framework — run via Node test runner):

- `machineRecognitionSchema` accepts the contract example.
- `machineRecognitionSchema` rejects invalid `difficulty` (e.g. `'expert'`).
- `machineRecognitionSchema` rejects `confidence` outside `0..1`.
- `machineRecognitionSchema` rejects empty `possibleExercises`.
- `recognizeMachine('')` returns `{ ok: false }` with kind `missing_image`.
- `recognizeMachine('mock://...')` returns `{ ok: true }` with a valid typed result.
- `recognizeMachine` forces `needsConfirmation = true` when `confidence < 0.60`.
- `recognizeMachine` rejects an invalid provider response with kind
  `invalid_response`.
- `recognizeMachine` returns kind `provider_error` when the provider throws.
- `mockProvider` refuses an empty `imageUri`.
- The public API never throws for these expected states; callers branch on
  `result.ok`.

Manual: app should remain openable; no UI wiring in this phase.

### Scan Result (Phase 6.4 — validation flow)

- Loading state: a clean photo card (contain, no squeeze) +
  "Analyse de la machine…" spinner.
- On success, a **validation stage** appears first (not the full fiche):
  Skia-rendered object area (light bg `#F8F8F5`, subtle dotted pattern,
  soft yellow radial glow, soft elliptical shadow). Without a real
  `cutoutUri`: a stable-ratio white card with the full photo
  (`fit="contain"`, no squeeze, no fake cutout) + a discrete
  "Détourage bientôt disponible" hint. With a real `cutoutUri` (future):
  the transparent cutout object floats centered above the glow/shadow.
  Premium label (machine name + type + "À confirmer" pill if
  `needsConfirmation`); actions `Refaire` / `Valider` / `Rejeter` + hint.
- The full fiche (name, confidence, description, muscles, exercises with
  setup/execution/mistakes/safety) and the save button are shown **only
  after the user presses `Valider`**.
- `Refaire` → `/camera`; `Rejeter` → `/`.
- Error state: readable message per `error.kind`
  (`missing_image | invalid_response | provider_error`), with "Réessayer",
  "Reprendre une photo", and "Accueil".
- Missing image state: "Image manquante" with CTAs.
- Save flow (idle/saving/saved/error) and SQLite persistence remain
  functional after validation.

### Saved Machines (Phase 5)

- Loading state appears while fetching.
- Empty state appears when no machine is saved, with "Scanner une machine".
- Error state appears if the database read fails.
- Saved machines appear after save, ordered by `createdAt DESC`.
- Each item (`SavedMachineCard`) shows name, thumbnail, primary muscles,
  confidence, and save date; tapping opens the detail screen.
- List refreshes on focus (after returning from detail or scan-result).

### Machine Detail (Phase 5)

- Loading state appears while fetching.
- Not found state appears for an invalid/missing machine id, with a
  "Retour à la liste" CTA.
- Error state appears if the database read fails.
- On success: photo, `MachineResultCard` (name, confidence, description,
  muscles, exercises with setup/execution/mistakes/safety), a
  "Supprimer cette machine" action (with deleting/error states), and a
  "Retour à la liste" CTA.
- After delete, the screen navigates back to `/saved-machines` (replace).

### Persistence (Phase 5)

- After saving a machine and restarting the app, the machine still appears
  in the saved list.
- The saved photo remains visible after restart (copied to the app
  document directory).
- Deleting a machine removes it from the list after restart.

### Reveal Effect (Phase 6.3 — honest photo-card reveal)

- The captured photo is shown in full via `contentFit: 'contain'` — no
  weird left/right cropping. The whole machine is visible.
- No fake object cutout: without a real `cutoutUri`, there is no central
  cropped rectangle / vignette pretending to detour the object.
- The photo appears on a bright neutral card (`#FAFAFA`) and settles
  gently (`scale 1 -> 0.98`, slight lift) like a sticker/card.
- A soft drop shadow is visible under the card (no rectangular bar, no
  gray blobs/pipes behind the title).
- Sober deterministic fragments dissolve around the photo (off-white /
  light gray, no confetti / sparkles / color) and fade.
- The recognition label is premium typography under the photo: machine name
  (black, fontWeight 900, light textShadow) + "Machine détectée" + a small
  discrete "À confirmer" pill when `needsConfirmation`. No heavy gray pill.
- During loading the "Analyse de la machine…" caption is visible.
- On error the reveal aborts, "Analyse impossible" shows, and the error
  card appears below — never blocked.
- If the image fails to load, a clean bright card is shown with the
  loading/error label; no crash.
- The slower timeline (~1800-2200ms) lets the dissolution, settle, shadow
  and label be perceived; the result card slides in after the reveal
  (`FadeInUp.delay(1300)` after success). No infinite animations after
  success; app remains responsive on iPhone.
- Save / saved / SQLite persistence and CTAs remain functional.

### Cutout Pipeline (Phase 6.6)

Manual (physical iPhone, Expo Go):

- With `EXPO_PUBLIC_CUTOUT_PROVIDER=disabled` (default): the scan flow is
  unchanged — validation shows the honest photo card with the discrete
  hint `Détourage indisponible`; no backend call is made; nothing blocks.
- With `EXPO_PUBLIC_CUTOUT_PROVIDER=remote` and the server running with
  `CUTOUT_PROVIDER=remove-bg` + `REMOVE_BG_API_KEY`:
  - after recognition, a brief `Détourage de l'objet…` stage appears;
  - the validation stage then shows the real transparent object centered
    on the light background with glow + shadow (no white photo rectangle);
  - the details screen shows the cutout at the top;
  - after save, the saved list thumbnail and detail use the cutout;
  - after app restart, the saved cutout still displays (durable
    `machine-scan-cutouts/` folder).
- With `remote` but the backend stopped or failing: recognition still
  works, validation falls back to the honest photo card + hint; no crash,
  no infinite loading.
- Old saved machines (created before Phase 6.6) still load: list/detail
  fall back to `imageUri`.

Automated (`src/features/machine-scan/cutout/generate-cutout.test.ts`):

- empty `imageUri` → `{ ok: false, kind: 'invalid_input' }`.
- provider `disabled` → `{ ok: false, kind: 'cutout_disabled' }`.
- unknown provider value → treated as disabled.
- provider `remote` without `EXPO_PUBLIC_API_BASE_URL` →
  `{ ok: false, kind: 'invalid_input' }` (Missing EXPO_PUBLIC_API_BASE_URL).

### Cutout Debug (Phase 6.6.1, dev only)

QA finding:

- backend `/health` was reachable from iPhone
- no `POST /api/machine-cutout` appeared during scan
- issue is on mobile trigger/env/config side, not remove.bg
- added dev-only cutout debug panel and logs
- improved no-cutout fallback from narrow vertical photo to wide
  cover-style photo card

Manual (physical iPhone, Expo Go, dev build):

- After a scan, the `Cutout debug` panel is visible on the cutout loading
  and validation screens (dev only; never in production).
- With `.env` loaded correctly, the panel shows `provider: remote` and
  `api: http://<mac-lan-ip>:3000`; status goes `loading` →
  `success`/`failed`.
- If the panel shows `provider: disabled` / `api: empty`, Expo did not
  load `.env` → restart with `npx expo start -c` and fully close/reopen
  Expo Go.
- On `failed`/`disabled`, the `Relancer le détourage` button re-runs the
  cutout without retaking the photo.
- Metro console shows `[cutout] generateMachineCutout:start` /
  `remote:request:start` / `remote:response` (never the base64 payload).
- Server terminal shows `[cutout-server] POST /api/machine-cutout` when
  the request fires.
- Fallback visual: without `cutoutUri`, the photo fills the white card
  wide (cover crop, no narrow vertical strip), with the
  `Détourage indisponible` hint; the panel shows
  `visual mode: photo-fallback-cover`.

### Backend Cutout Diagnostics (Phase 6.6.2)

QA finding:

- mobile app reads remote env correctly
- mobile app reaches backend (`POST /api/machine-cutout` logged)
- backend did not expose enough safe diagnostics for remove.bg failures
- loading state still displayed a narrow vertical photo inside a white card
- added backend provider logs, safe debug endpoint, provider status
  propagation, and shared wide cover-style no-cutout photo fallback

Manual (server terminal, during a scan):

- `GET /api/machine-cutout/debug` returns
  `{ ok, provider, hasRemoveBgApiKey, nodeVersion, runtime }` — never the
  key value.
- During a scan, the terminal shows the full lifecycle:
  `POST /api/machine-cutout start` → `request parsed` (mimeType, base64
  length, provider) → `[remove-bg]` provider logs (hasApiKey, input,
  response status/content-type, success or ≤300-char failure preview) →
  `cutout result` → `end` (statusCode, durationMs).
- On failure, the mobile debug panel shows `provider status` and a safe
  `provider message` preview.
- No log line ever contains the API key or the full base64 payload.
- Local pipeline test without the app:
  `npx tsx server/scripts/test-cutout.ts ./photo.jpg` (writes the
  git-ignored `tmp-cutout-test.png` on success).

Automated (`server/cutout/cutout-service.test.ts`):

- empty `imageBase64` → `invalid_input`.
- no `CUTOUT_PROVIDER` → `cutout_disabled`.
- `remove-bg` without `REMOVE_BG_API_KEY` → `provider_error`.
- debug info reports `hasRemoveBgApiKey` without exposing the key value.

### iOS Cutout Local File Write (Phase 6.6.3)

QA finding:

- backend remove.bg pipeline returned HTTP 200 and valid PNG
- mobile received HTTP 200 from backend
- failure occurred while writing cutoutBase64 to local file
- fixed cutout file writing for Expo SDK 54 / expo-file-system v19

Manual (physical iPhone, Expo Go, remote provider + valid key):

- After a scan, Metro logs show `[cutout] local-write:start` →
  `local-write:directory` → `local-write:success` (with `exists: true`
  and a plausible `size`).
- The debug panel shows `status: success` and
  `visual mode: real-cutout`; the detoured object renders in validation,
  details, and saved list/detail, and survives an app restart.
- If the write still fails, the panel shows `write error: <cause>` and
  Metro logs `[cutout] local-write:error` with `causeName` /
  `causeMessage` — copy these for diagnosis.

Automated (`src/features/machine-scan/cutout/write-cutout-file.test.ts`):

- mime type → extension mapping (png / webp / fallback).
- `createCutoutFileName` unique names with the right extension.
- `stripDataUriPrefix` removes a `data:...;base64,` prefix.
- pure base64 decoder round-trips text and binary data, rejects invalid
  payloads.
- `writeCutoutBase64ToFile` returns `invalid_input` for empty or invalid
  base64 without touching the filesystem.

### Cutout UX Polish (Phase 6.6.4)

Manual (physical iPhone, Expo Go, remote provider):

- No debug panel is visible anywhere in the scan flow (it is disabled by
  default behind `SHOW_CUTOUT_DEBUG_PANEL`; flip the flag in
  `src/features/machine-scan/cutout/cutout-debug.ts` to re-enable in dev).
- During `Analyse de la machine…` / `Détourage de l'objet…`: the photo
  card shows a subtle diagonal shimmer and a few slow sparkles — smooth,
  not flashy, no aggressive blinking.
- When the cutout arrives: the photo background dissolves with a short
  dust-particle transition (~0.9 s, plays once), the detoured object
  fades in and settles with glow + shadow.
- The cutout has a subtle white sticker-style contour following its
  silhouette — no big halo, no rectangle border.
- After the reveal, nothing keeps animating (no infinite particles).
- Metro console stays quiet on success (verbose logs gated); errors still
  log safely in dev.
- Fallback: stop the server and scan — clean wide photo fallback +
  `Détourage indisponible`, no crash, actions work.
- Details / save / saved list / saved detail unchanged and functional.

Automated (`src/features/machine-scan/cutout/cutout-debug.test.ts`):

- `CUTOUT_DEBUG_LOGS_ENABLED` and `SHOW_CUTOUT_DEBUG_PANEL` are false by
  default.
- `logCutoutDebug` stays silent when the flag is off.
- `warnCutoutDebug` stays silent outside dev builds.

Manual visual consistency (no `cutoutUri`):

- Recognition loading, `Détourage de l'objet…` loading, validation
  fallback, details fallback, and saved detail fallback all show a wide
  cover-style photo filling the white card — no narrow vertical photo in
  a large white rectangle anywhere.

Automated (`src/features/machine-scan/storage/mapping.test.ts` additions):

- row `cutoutUri` is preserved through `mapRowToMachineScan`.
- missing/NULL `cutoutUri` maps to `undefined`.
- `toMachineScanInput` preserves an optional `cutoutUri`.

### Remote AI

- Mock provider still works.
- Remote provider can be enabled.
- Network error is displayed.
- Invalid JSON is rejected.
- Low-confidence response is shown as uncertain.

## Automated Checks

Add when practical:

- Zod schema validation tests.
- Recognition adapter tests.
- Storage repository tests.
- Basic component render tests.

Phase 3 + 5 automated tests (Node test runner via `tsx`, no framework):

- `src/features/machine-scan/api/recognize.test.ts`: schema accept/reject,
  recognition result `ok | error` kinds, low-confidence forcing, mock
  refusal.
- `src/features/machine-scan/storage/mapping.test.ts`: row → `MachineScan`
  parsing, `needsConfirmation` integer → boolean, resilient JSON handling,
  `toMachineScanInput`, `toRecognitionResult`, unique `generateId`.

Run with:

```bash
npx tsx --test src/features/machine-scan/api/recognize.test.ts src/features/machine-scan/storage/mapping.test.ts src/features/machine-scan/cutout/generate-cutout.test.ts
```

## Required Checks Before Commit

Run available checks:

```bash
git status
npm run typecheck
npm run lint
```

If test script exists:

```bash
npm test
```

Then:

```bash
git status
```

## Phase 6.6.5 — Premium cutout reveal staging

QA finding:

- real cutout pipeline works
- cutout rendering was too small and too flat
- dust/background disappearance effect was not visible
- sticker border was invisible
- this phase enlarges the cutout, improves the premium background, adds a
  visible dust reveal, and strengthens the sticker-style outline

Manual QA on iPhone (required):

- Cutout appears large (≥ ~60% of the stage height), centered, undistorted.
- Background shows warm glow + dotted pattern, no flat white.
- Dust/disappearance effect is clearly visible when the cutout arrives.
- Sticker-style white border is visible around the object.
- Reveal plays exactly once; buttons stay usable; no flashes.
- Details screen and saved machine detail showcase the cutout on the
  premium stage.
- Fallback (cutout failed/disabled): honest photo card, no dust, no
  sticker border, "Détourage indisponible", actions available.
- Old saved entries without `cutoutUri` still render the photo fallback.

## Phase 6.6.6 — Premium cutout sizing and sticker beam polish

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

Manual QA on iPhone (required):

- Cutout clearly larger in validation (~74% height / 96% width) and in
  details (~82% height / 98% width, 380 px stage), never distorted or
  cropped.
- Dust reveal is slower (~1.8 s total) and clearly visible in front of
  the photo and on the premium background.
- Sticker border reads as a thick (~8 px) die-cut white edge following
  the silhouette.
- A thin light beam orbits the sticker during validation (~5.6 s per
  turn), subtle, never blocking buttons, stops when leaving the screen.
- Glow and ground shadow give visible depth (object looks placed, not
  pasted).
- Sparkles are small glints, not floating confetti; shimmer is a thin
  premium scan band.
- Validation buttons look premium (graphite confirm pill with check
  badge, glassy side pills with icons) and press feedback works.
- Fallback (cutout failed/disabled): no beam, no sticker, no dust.
- Save, saved list, and saved detail still work with and without
  `cutoutUri`.

## Phase 6.6.7 — Details premium polish and typography

QA finding:

- cutout validation is mostly accepted
- details hero cutout is still too small for future gym machines
- details card needs stronger premium styling
- machine name should live inside the cutout hero card with sticker
  treatment
- app typography should move to Plus Jakarta Sans for headings and Inter
  for body copy
- added a darker contour beam alongside the existing orbit beam

Manual QA on iPhone (required):

- A darker graphite/golden contour counter-rotates inside the light beam
  during validation; subtle, never dirty, absent in details/fallback.
- Details hero cutout is clearly larger (~90% of the hero card) and the
  hero card reads premium (cream background, deep soft shadow, hairline
  border).
- Machine name appears inside the hero card as a slightly tilted sticker
  pill (name + type), and is not duplicated in the info card below.
- With photo fallback (no cutout): no sticker label on the photo, name
  stays in the info card.
- Info block shows three premium cards (summary with confidence pill,
  muscles, exercises) instead of one gray slab.
- Headings render in Plus Jakarta Sans Bold, body copy in Inter, across
  home, camera overlay, validation, details, saved screens.
- App still boots and renders if fonts fail to load (system fallback).
- Save, saved list, saved detail, old entries without `cutoutUri` intact.
