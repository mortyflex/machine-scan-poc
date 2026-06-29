# UI Effect Spec — CapWords-like Machine Reveal

## Goal

Create a premium reveal effect after the user captures a gym machine photo.

The effect should make the machine feel extracted from the real world, while the surrounding scene breaks apart, dims, or fades.

## POC Constraint

Do not require perfect segmentation in V1.

The first satisfying version should fake the effect with:

- Captured image.
- Background dim.
- Focus area.
- Particles.
- Label reveal.
- Result card transition.

## Effect V1

Use:

- Captured image as background.
- Dark overlay.
- Animated focus ring.
- Subtle zoom.
- Particle burst around approximate object area.
- Result label appearing from behind the image.
- Machine result card sliding upward.

## Delivered V1 (Phase 6)

The V1 effect is implemented in
`src/features/machine-scan/components/MachineRevealEffect.tsx` using
React Native Reanimated only (no Skia), for reliability in Expo Go on
SDK 54. It fakes the reveal without real segmentation.

Delivered elements:

- Captured image as background (`expo-image`, `contentFit: cover`); falls
  back to a clean dark zone if the image fails to load.
- Progressive background dim (overlay `opacity 0 -> 0.5`, ~500ms after a
  100ms delay).
- Subtle photo zoom (`scale 1 -> 1.05`, ~1400ms ease-out).
- Focus ring + halo scaling in around the approximate central object area
  (ring scale `0.6 -> 1`, ~500ms after a 250ms delay).
- Six staggered, gently pulsing particles positioned around the ring.
- Loading caption ("Analyse de la machine…") during loading, fading out
  on success/error.
- Machine name label appearing on success (opacity + translateY), with an
  "À confirmer" tag when `needsConfirmation`.
- Result card slides upward via `FadeInUp` on success.

Behaviour by state:

- Loading: full reveal timeline plays; the loading caption is visible.
- Success: label reveals; result card slides in; the effect does not hide
  the result for too long and adds no artificial delay to the flow.
- Low confidence: label shows the machine name with an "À confirmer" tag.
- Error: ring/particles fade out, photo stays lightly dimmed, and the
  error card appears below — error state is never blocked.

Skipped for V1 (deferred):

- Real segmentation, bounding box, background blur, and Skia-based layers
  (see Effect V2 / V3).

## Effect V2

Use:

- Approximate bounding box.
- Particles around bounding box.
- Subtle zoom on object area.
- Background blur.
- Fake depth shadow.

## Effect V3

Use:

- Real segmentation mask.
- Extracted machine layer.
- Machine scale/translate/rotate.
- Background disintegration.
- Label attached to machine.

## Timing

Target duration:

```txt
0ms    Photo freezes
150ms  Background dims
300ms  Object focus starts
600ms  Particles appear
900ms  Machine label appears
1200ms Result card appears
```

## Animation Values

```txt
background opacity: 1 -> 0.72
background blur: 0 -> 8
object scale: 1 -> 1.06
object translateY: 0 -> -18
label opacity: 0 -> 1
card translateY: 40 -> 0
```

## Visual Direction

The effect should feel:

- Premium.
- Fast.
- Tactile.
- Useful.
- Not childish.
- Not overdone.

Avoid:

- Too many particles.
- Long loading animation.
- Generic AI sparkles.
- Heavy gradients everywhere.
- Animations that hide the result for too long.

## States

### Loading

- Show captured image.
- Show scan/reveal animation.
- Show "Analyse de la machine".

### Success

- Reveal machine name.
- Show confidence.
- Show result card.

### Low Confidence

- Reveal machine name but show uncertainty.
- Use text like "À confirmer".
- Allow the user to continue, but make uncertainty visible.

### Error

- Keep captured photo visible.
- Show error message.
- Allow retry.
- Allow back to camera.

## Success Criteria

The effect is successful when:

- It feels premium without real segmentation.
- It works with the mock result.
- It works while remote AI is loading.
- It does not block error states.
- It does not make the app feel slow.
- It runs smoothly on iPhone.
