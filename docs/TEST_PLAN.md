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
  light bg, soft yellow glow, full photo in a stable-ratio card (no fake
  cutout, no squeeze), premium label (machine name + type + "À confirmer"
  pill if `needsConfirmation`), and actions `Refaire` / `Valider` /
  `Rejeter` + hint.
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
npx tsx --test src/features/machine-scan/api/recognize.test.ts src/features/machine-scan/storage/mapping.test.ts
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
