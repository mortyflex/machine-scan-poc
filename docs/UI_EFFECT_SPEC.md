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

## Delivered V2 — CapWords-like pseudo cutout

This version approximates the CapWords effect without true segmentation.

It uses:
- duplicated image layer
- clipped pseudo subject area
- background dissolve
- deterministic fragments
- bright neutral final background
- floating object shadow
- recognition label
- fallback for future cutoutUri

Implemented in `src/features/machine-scan/components/MachineRevealEffect.tsx`
with React Native Reanimated only (no Skia, no native module) for Expo Go
compatibility on SDK 54.

### Props (future-ready)

```ts
type MachineRevealEffectLevel = 'basic' | 'pseudo-cutout';

type MachineRevealEffectProps = {
  imageUri: string;
  machineName?: string;
  status: 'loading' | 'success' | 'error';
  needsConfirmation?: boolean;
  effectLevel?: MachineRevealEffectLevel; // default 'pseudo-cutout'
  cutoutUri?: string; // future transparent PNG/WebP from real segmentation
};
```

When `cutoutUri` is provided, it is used as the true object layer instead of
the clipped photo pseudo-cutout. Today it is usually `undefined`.

### Layers

```txt
Layer 1 — Original photo background (fades 1 -> 0.08)
Layer 2 — Dissolve / dust veil + deterministic fragments (fly outward)
Layer 3 — Pseudo-cutout object layer (duplicated, clipped central region)
Layer 4 — Soft elliptical shadow under the object (opacity 0 -> 0.22)
Layer 5 — Recognition label (machine name + "Machine détectée" + "À confirmer")
Layer 6 — Result transition area (handled by the screen: card slides in)
```

### Pseudo-cutout geometry (responsive, no real detection)

```txt
focusWidth:  78% of container
focusHeight: 46% of container
focusLeft:   centered (11%)
focusTop:    19% (centerY 42%)
focusRadius: 34
```

The cutout duplicates the original image and clips the central region so it
aligns pixel-perfect with the background. As the background fades and the
cutout scales/translates/rotates, the region appears to detach.

Cutout transform: `scale 1 -> 1.08`, `translateY 0 -> -24`,
`rotateZ 0 -> -0.7deg`, plus a white edge glow border and a subtle halo.

### Fragments (deterministic, no Math.random at render)

- 28 fragments generated via `useMemo` from container size.
- Start on an ellipse around the focus rect perimeter, fly outward.
- Sizes 2-9px, light gray / off-white colors, slight rotate.
- `opacity 0 -> 0.85 -> 0`, `scale 1 -> 0.35`, short duration.
- Resembles photographic matter breaking into fine dust (not confetti).

### Background transition

```txt
background photo opacity: 1 -> 0.08
bright neutral background opacity: 0 -> 1 (final #FAFAFA)
dust veil opacity: 0 -> 0.3 -> 0
```

The final background is a bright neutral `#FAFAFA` (not black).

### Shadow

Elliptical soft shadow under the cutout: appears after ~500ms,
`opacity 0 -> 0.22`, `scaleX 0.7 -> 1`, simulated blur via rounded View.

### Label

Under the object (top ~70%):

- success: machine name (bold) + "Machine détectée" + "À confirmer" pill if
  `needsConfirmation`.
- loading: "Analyse de la machine…" + spinner.
- error: "Analyse impossible" + "Réessaie ou reprends une photo."

Label animation: `opacity 0 -> 1`, `translateY 8 -> 0`, `scale 0.96 -> 1`,
delay ~900ms.

### Timeline (~1200-1600ms)

```txt
0ms      photo visible, natural
100-350  background starts desaturating/brightening, dust appears
350-700  pseudo-cutout detaches (scale/translate/rotate), bg loses opacity,
         fragments fly outward
700-1000 background becomes near-white, object floats, shadow appears,
         fragments fade out
1000-1300 label appears under the object (+ "À confirmer" if needed)
1300+    result card is readable (screen slides it in with FadeInUp)
```

The timeline plays during the ~600ms mock loading and adds no artificial
delay to the flow.

### Error / fallback

- On error the dissolve is aborted: the photo stays visible, the bright
  background and shadow fade out, and "Analyse impossible" shows. The error
  card appears below — error state is never blocked.
- If the image fails to load, a clean bright background is shown with the
  loading/error label; no crash.
- `effectLevel: 'basic'` provides a simpler fallback (photo + light dim +
  label) without cutout/fragments.

### Skipped for V2 (deferred)

- Real segmentation, real cutout, background blur, Skia layers (V3).


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
