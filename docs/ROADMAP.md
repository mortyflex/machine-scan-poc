# Roadmap — Machine Scan POC

## Phase 0 — Project Setup

Status: TODO

Goals:

- Create Expo app.
- Add project docs.
- Add AGENTS.md and CLAUDE.md.
- Add Opencode skills.
- Prepare feature folders.

Done when:

- App is created.
- Required dependencies are installed.
- Docs exist.
- Agent files exist.
- First commit is done.

## Phase 1 — App Shell

Status: DONE

Goals:

- Home screen.
- Navigation.
- Base theme.
- Placeholder screens.

Done when:

- Home screen works.
- Camera route opens.
- Saved machines route opens.
- Machine detail placeholder exists.
- Shared UI components exist.

Notes:

- Routes live in `src/app/` (Expo Router directory used by the project).
- Stack-based navigation (replaced the template tab layout).
- Minimal theme added under `src/shared/theme` (colors, spacing, typography)
  with light/dark support via `useAppTheme`.
- Shared UI components added under `src/shared/components`:
  `Screen`, `PrimaryButton`, `Card`, `AppText`.
- Placeholder screens created for camera, scan-result, saved-machines and
  machine detail (`machine/[id]`).
- Removed leftover template route `src/app/explore.tsx`.
- No camera capture or AI logic in this phase (placeholders only).

## Phase 2 — Camera Capture

Status: DONE

Goals:

- Camera permission.
- Camera preview.
- Capture photo.
- Pass image URI to scan result screen.

Done when:

- Camera permission flow works.
- Capture button works.
- Captured image URI reaches scan result screen.
- Permission denied state is usable.

Notes:

- Capture logic isolated in `src/features/camera/components/CameraCapture.tsx`,
  route `src/app/camera.tsx` is a thin wrapper (camera feature stays
  independent of UI navigation layer).
- Uses `expo-camera` `CameraView` + `useCameraPermissions` hook.
- States handled: permission loading (null), permission denied (with retry +
  denied-canAskAgain=false messaging), camera ready, capturing, capture error
  (onMountError + takePictureAsync failure).
- After capture, navigates with `router.replace('/scan-result', { imageUri })`
  so the back button does not reopen the camera.
- `scan-result` screen shows the captured photo (`expo-image`) or a clear
  "image manquante" state with a CTA back to camera; an AI placeholder card
  points to Phase 3/4.
- `app.json` configured with `expo-camera` plugin and `NSCameraUsageDescription`
  for iOS.

Manual iPhone validation required.

## Phase 3 — Machine Recognition Contract

Status: DONE

Goals:

- TypeScript types.
- Zod schema.
- Mock recognition provider.
- Error handling.

Done when:

- Mock provider returns a valid machine result.
- Invalid response is rejected.
- Low confidence state is represented.
- Recognition code is independent from UI.

Notes:

- Types added in `src/features/machine-scan/types`:
  `MachineExercise`, `MachineRecognitionResult`, `MachineScan`.
- Strict Zod schema in `src/features/machine-scan/api/schema.ts`:
  enums (`difficulty`, `machineType`), `0..1` confidence, non-empty strings,
  arrays of strings, `possibleExercises` at least one, `uncertaintyReason`
  nullable.
- Mock provider in `src/features/machine-scan/api/mock-provider.ts`:
  returns a leg press result, simulates ~600ms latency, refuses empty
  `imageUri`, independent from UI.
- Public API `recognizeMachine(imageUri)` in
  `src/features/machine-scan/api/recognize.ts`: validates via Zod (safeParse),
  forces `needsConfirmation` when `confidence < 0.60`, returns a typed
  `RecognitionResult` discriminated union (`ok | error`) with error kinds
  `missing_image | invalid_response | provider_error`. The public API never
  throws for these expected states; a provider may throw internally and the
  API converts that into `{ ok: false, error: { kind: 'provider_error' } }`.
- Tests in `src/features/machine-scan/api/recognize.test.ts` (no framework,
  run via Node built-in test runner through `tsx`): 10 cases covering
  schema accept/reject, missing image, valid result, low confidence forcing,
  invalid response, provider error, mock refusal.
- `scan-result` screen intentionally NOT wired to the provider in this phase
  (planned for Phase 4).

## Phase 4 — Scan Result

Status: DONE

Goals:

- Display captured image.
- Show mocked machine result.
- Show exercises.
- Add loading/error/success states.

Done when:

- Scan result screen shows captured image.
- Mock result appears.
- Exercises are readable.
- Error and loading states exist.

Notes:

- `src/app/scan-result.tsx` reads `imageUri` from Expo Router params,
  launches `recognizeMachine(imageUri)` on mount, and branches on the
  `RecognitionResult` (`ok | error`) without try/catch for expected states.
- States handled: missing image, loading, success, error (mapped by
  `error.kind`: `missing_image | invalid_response | provider_error`),
  low-confidence ("À confirmer" badge + uncertainty reason).
- Success fiche built from feature components under
  `src/features/machine-scan/components/`: `MachineResultCard`,
  `RecognitionConfidence`, `MuscleTags`, `ExerciseList`. These are pure
  presentational components, independent from Expo Router.
- Each exercise shows name, difficulty badge, setup, execution, common
  mistakes, and safety notes.
- CTAs: "Reprendre une photo" (replace to `/camera`), "Accueil" (replace
  to `/`), and a disabled "Sauvegarder cette machine" placeholder tagged
  "Disponible en Phase 5".
- Save, reveal effect, and real AI are intentionally out of scope
  (Phases 5, 6, 7).
- Manual visual validation required on a physical device before the human
  owner accepts the phase.

## Phase 5 — Local Persistence

Status: DONE

Goals:

- SQLite schema.
- Save scanned machine.
- List saved machines.
- Open saved machine detail.

Done when:

- User can save a machine.
- Saved machine appears in list.
- User can open machine detail.
- Data persists after restart.

Notes:

- Repository in `src/features/machine-scan/storage/` built on
  `expo-sqlite` (`openDatabaseAsync`). Schema: `machine_scans` table with
  JSON `TEXT` columns for arrays and `INTEGER` for `needsConfirmation`.
- All public storage functions return a typed `StorageResult<TData>`
  (`ok | error`) and never throw for expected business errors
  (`database_error | not_found | invalid_input`), following the project
  Error Handling Rules.
- `initMachineScanDatabase()` is called once at app startup in
  `_layout.tsx` (with a loading/error screen guard).
- Image persistence: the captured photo is copied into
  `Paths.document/machine-scans/` via `expo-file-system` so images survive
  app restarts (falls back to the original URI if copying fails).
- `scan-result.tsx` save button is now active on success, with
  idle / saving / saved / error states. On save success, a "Voir mes
  machines" CTA replaces the button.
- `saved-machines.tsx` handles loading / empty / error / success and
  refreshes on focus (`useFocusEffect`). Each item is a `SavedMachineCard`
  leading to the detail screen.
- `machine/[id].tsx` handles loading / not_found / error / success and
  reuses `MachineResultCard`. Includes a "Supprimer cette machine" action
  (with deleting/error states) and a "Retour à la liste" CTA.
- Unit tests for pure storage mapping run in Node via `tsx`:
  `src/features/machine-scan/storage/mapping.test.ts`.
- Manual visual validation required on a physical device before the human
  owner accepts the phase.

## Phase 6 — Reveal Effect V1

Status: DONE

Goals:

- CapWords-like animation without segmentation.
- Background dim/blur.
- Particles.
- Result label.
- Smooth transition.

Done when:

- Reveal animation appears after capture.
- Result card appears after animation.
- Effect does not block success/error states.
- App remains responsive.

Notes:

- Pure component `src/features/machine-scan/components/MachineRevealEffect.tsx`,
  independent from Expo Router. Props: `imageUri`, `machineName?`,
  `status: 'loading' | 'success' | 'error'`, `needsConfirmation?`.
- Built with React Native Reanimated only (no Skia) for reliability in
  Expo Go on SDK 54. Skia was intentionally skipped to avoid blocking the
  phase; the effect fakes the reveal without real segmentation.
- V1 timeline: progressive background dim (`opacity 0 -> 0.5`), subtle
  photo zoom (`scale 1 -> 1.05`), focus ring + halo scaling in around the
  approximate central object area, six staggered pulsing particles around
  the ring, a loading caption ("Analyse de la machine…") during loading,
  and the machine name label appearing on success (with an "À confirmer"
  tag when `needsConfirmation`).
- The timeline plays during the mock loading (~600ms) and does not add an
  artificial delay to the flow. On success the machine result card slides
  in with `FadeInUp`; the label and result remain readable.
- On error the effect dims the photo lightly, fades out the ring/particles,
  and lets the error card appear below — error state is never blocked.
- If the captured image cannot be displayed, the effect shows a clean dark
  zone and the flow continues without crashing.
- All existing states preserved: missing image, loading, success, error,
  low-confidence, save (idle/saving/saved/error), SQLite persistence, and
  CTAs.
- Manual visual validation required on a physical device before the human
  owner accepts the phase.

## Phase 6.1 — Reveal Effect Corrective (CapWords-like pseudo cutout)

Status: DONE

Goal:

- Rebuild the reveal to closely match the CapWords reference: photo freeze
  -> background dissolves into dust -> pseudo-cutout detaches -> bright
  neutral background -> soft shadow under the object -> recognition label
  -> result card.

Notes:

- `MachineRevealEffect` rewritten as layered pseudo-cutout using Reanimated
  only (no Skia, no native module, Expo Go compatible on SDK 54).
- New props: `effectLevel?: 'basic' | 'pseudo-cutout'` (default
  `'pseudo-cutout'`) and future-ready `cutoutUri?` (transparent PNG/WebP
  from a future real segmentation; falls back to the clipped photo
  pseudo-cutout when undefined).
- Layers: original photo (fades `1 -> 0.08`), dust veil + 28 deterministic
  fragments flying outward (computed via `useMemo`, no `Math.random` at
  render), bright neutral background (`#FAFAFA`, `0 -> 1`), soft
  elliptical shadow under the object (`opacity 0 -> 0.22`), pseudo-cutout
  object layer (duplicated, clipped central region, `scale 1 -> 1.08`,
  `translateY 0 -> -24`, `rotate 0 -> -0.7deg`, white edge glow), and the
  recognition label under the object.
- Timeline ~1200-1600ms, plays during the ~600ms mock loading with no
  artificial delay. On success the label shows the machine name +
  "Machine détectée" (+ "À confirmer" if `needsConfirmation`); the result
  card slides in via `FadeInUp`.
- On error the dissolve is aborted (photo stays visible, bright bg/shadow
  fade out, "Analyse impossible" shows); the error card appears below.
  Image load failure shows a clean bright background with no crash.
- All existing states preserved: missing image, loading, success, error,
  low-confidence, save (idle/saving/saved/error), SQLite persistence, CTAs.
- Manual visual validation required on a physical device before the human
  owner accepts the phase.

## Phase 6.2 — Visual QA tuning

Status: DONE

Adjusted after iPhone QA:

- larger pseudo-cutout
- less square sticker shape
- stronger fragments
- removed unexplained bottom bar
- stronger floating movement
- visible elliptical shadow
- slower reveal timeline

Notes:

- Pseudo-cutout enlarged to `90% x 58%` (centerY 44%), `focusRadius 48`
  with a multi-layer edge (outer halo + main border + inner highlight) so
  it no longer reads as a cropped rectangle.
- Fragments reinforced: 32 total (24 back / 8 front over the object),
  sizes 4-12px, peak opacity 1, travel 24-90px, rotate -33..33deg,
  duration 800ms.
- The hard pill that read as a "bar" is replaced by a 3-layer soft
  elliptical shadow (66% / 55% / 42% width, blur simulated), opacity
  `0 -> 0.30`, `scaleX 0.75 -> 1.05`, appearing at ~1200ms.
- Stronger floating: `scale 1 -> 1.13`, `translateY 0 -> -42`,
  `translateX 0 -> 4`, `rotate 0 -> -1.2deg`.
- Slower timeline ~2000-2200ms: dissolve 250-1200, cutout 600-1550,
  shadow 1200-1700, label 1700-2200.
- The result card entrance is delayed (`FadeInUp.delay(1100)`) so the
  reveal reads before the fiche slides in; no artificial delay on the
  recognition itself.
- `effectLevel` default remains `'pseudo-cutout'`; `'basic'` kept as
  fallback. All existing flows preserved (missing/loading/success/error/
  low-confidence/save/saved/SQLite/CTAs).
- Manual visual validation required on a physical device before the human
  owner accepts the phase.

## Phase 7 — Real AI Provider

Status: TODO

Goals:

- Backend adapter.
- Gemini/OpenAI provider.
- Strict JSON validation.
- Fallback/error handling.

Done when:

- Mock provider still works.
- Remote provider can be enabled.
- API keys are not exposed in mobile code.
- Invalid AI responses are rejected.
- Remote error state is usable.

## Phase 8 — Polish

Status: TODO

Goals:

- Mobile-first UI polish.
- Empty states.
- Error states.
- Performance pass.
- Test pass.

Done when:

- Full flow is presentable.
- No obvious broken screen remains.
- Docs are up to date.
- Repo is clean after commit.
