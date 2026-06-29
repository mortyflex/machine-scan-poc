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

### Scan Result

- Captured image is visible.
- Loading state is visible.
- Machine name is visible.
- Confidence is visible.
- Muscles are visible.
- Exercises are visible.
- Save button is visible.
- Error state has a retry or back action.

### Saved Machines

- Empty state appears when no machine is saved.
- Saved machines appear after save.
- Machine detail opens from list.
- Saved data persists after app restart.
- Not found state appears for invalid machine id.

### Reveal Effect

- Animation starts after capture.
- Animation does not block result rendering.
- Error state still works.
- App remains responsive.
- Animation does not feel too long.

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
