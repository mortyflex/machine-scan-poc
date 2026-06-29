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

Status: TODO

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

## Phase 4 — Scan Result

Status: TODO

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

## Phase 5 — Local Persistence

Status: TODO

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

## Phase 6 — Reveal Effect V1

Status: TODO

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
