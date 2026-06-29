# Test Plan — Machine Scan POC

## Manual Checks

### Home

- User can open home screen.
- User can navigate to camera.
- User can navigate to saved machines.
- UI is readable on mobile.

### Camera

- Permission request appears.
- Denied permission state is understandable.
- Camera preview appears after permission.
- Capture button takes a photo.
- Captured image URI is passed to scan result.
- Capture error state is understandable.

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

### Scan Result (Phase 4)

- Captured photo is visible at the top when `imageUri` is present.
- Loading state shows "Analyse de la machine…" with a spinner.
- On success: machine name, type, confidence, description, alternative
  names, primary/secondary muscles, and possible exercises are visible.
- Each exercise shows name, difficulty badge, setup, execution, common
  mistakes, and safety notes.
- Low-confidence (`needsConfirmation` or `confidence < 0.60`) shows an
  "À confirmer" badge and the uncertainty reason when present.
- Error state shows a readable message per `error.kind`
  (`missing_image | invalid_response | provider_error`) — no technical
  stack is exposed.
- Error state offers a "Réessayer" action that re-runs recognition.
- "Reprendre une photo" navigates back to `/camera` (replace).
- "Sauvegarder cette machine" is active on success. Saving shows a
  "Sauvegarde…" state, then a "Machine sauvegardée" success card with a
  "Voir mes machines" CTA. Double-save is prevented while saving.
- "Accueil" navigates to `/` (replace).
- "Image manquante" state appears when navigated to without `imageUri`,
  with "Ouvrir la caméra" and "Accueil" CTAs.

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

### Reveal Effect (Phase 6.2 — tuned after iPhone QA)

- The captured photo is visible full-frame, then the background visibly
  dissolves: photo opacity drops to near-zero while a bright neutral
  (`#FAFAFA`) background appears.
- The pseudo-cutout is large (90% x 58%) and clearly visible immediately —
  not a small vignette; its high `borderRadius` (48) + multi-layer edge
  (halo + border + highlight) makes it read as a sticker, not a cropped
  rectangle.
- Deterministic dust fragments are clearly visible: 32 fragments, sizes
  4-12px, peak opacity 1, flying outward 24-90px with rotation; some render
  in front of the object. Not confetti / sparkles.
- The pseudo-cutout detaches strongly: `scale -> 1.13`, `translateY -42`,
  `translateX 4`, `rotate -1.2deg`.
- A visible soft elliptical shadow (3-layer) appears under the floating
  object; no rectangular bar remains below.
- On success the recognition label appears under the object (delay ~1700ms):
  machine name (bold) + "Machine détectée" + "À confirmer" pill when
  `needsConfirmation`; the result card slides in after the reveal
  (`FadeInUp.delay(1100)` after success) and stays readable.
- During loading the "Analyse de la machine…" caption is visible.
- On error the dissolve is aborted (photo stays visible), "Analyse
  impossible" shows, and the error card appears below — never blocked.
- If the image fails to load, a clean bright background is shown with the
  loading/error label; no crash.
- The slower timeline (~2000-2200ms) gives time to perceive dissolution,
  floating, shadow and label; no infinite animations after success; app
  remains responsive on iPhone.

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
