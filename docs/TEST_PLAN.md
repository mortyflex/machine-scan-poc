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

### Recognition

- Mock provider returns valid result.
- Invalid provider response shows error.
- Low confidence result shows confirmation state.
- Non-machine result does not create fake exercises.
- Missing image URI shows error state.

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
