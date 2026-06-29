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

## Delivered V2 — Honest CapWords-style reveal

QA decision (Phase 6.3):

- The pseudo-cutout rectangle was rejected: without real segmentation, the
  app must NOT fake an object extraction. Cropping a central rectangle
  looked cheap and misleading (e.g. on a mouse photo it just cut a piece
  of the scene instead of detouring the mouse).
- Default mode is now `photo-card` reveal (full photo, no fake cutout).
- The `real-cutout` mode is reserved for when a real `cutoutUri`
  (transparent PNG/WebP from a backend segmentation) is provided.
- The label was redesigned with simple premium typography; decorative gray
  blobs/pipes behind the title were removed.

Implemented in `src/features/machine-scan/components/MachineRevealEffect.tsx`
with React Native Reanimated only (no Skia, no native module) for Expo Go
compatibility on SDK 54.

### Props (future-ready)

```ts
type MachineRevealEffectLevel = 'photo-card' | 'real-cutout';

type MachineRevealEffectProps = {
  imageUri: string;
  machineName?: string;
  status: 'loading' | 'success' | 'error';
  needsConfirmation?: boolean;
  effectLevel?: MachineRevealEffectLevel; // default inferred from cutoutUri
  cutoutUri?: string; // future transparent PNG/WebP from real segmentation
};
```

Default: `effectLevel = cutoutUri ? 'real-cutout' : 'photo-card'`. The
`real-cutout` branch only activates when a real `cutoutUri` is provided;
otherwise the honest `photo-card` reveal is used. The fake rectangle
cutout has been removed entirely.

### Photo-card mode (default, no cutoutUri)

```txt
full photo (contentFit: contain — no weird crop)
→ bright neutral card (#FAFAFA)
→ sober dust fragments around the photo
→ photo settles gently as a card/sticker (scale 1 -> 0.98, translateY -6)
→ soft drop shadow under the card
→ premium label below
→ result card after the reveal
```

- The photo uses `contentFit: 'contain'` so the whole captured image is
  visible (no left/right cropping). The card is white with rounded corners.
- 28 deterministic fragments (off-white / light gray, semi-transparent),
  sizes 4-12px, fly outward from around the photo and fade. No confetti,
  no sparkles, no color.
- Card drop shadow: iOS `shadowOpacity 0 -> 0.16` (radius 18, offset y 14),
  Android `elevation`.
- Photo settles: `scale 1 -> 0.98`, `translateY 0 -> -6`.
- No fake object cutout, no central vignette, no gray blobs behind the
  title.

### Real-cutout mode (future, only with cutoutUri)

When a real `cutoutUri` is provided:

```txt
full photo (background)
→ real cutout object (transparent PNG) floats out
→ background dissolves to bright neutral
→ soft elliptical shadow under the object
→ premium label below
```

- The cutout image is rendered with `contentFit: 'contain'` and animated
  `scale 1 -> 1.13`, `translateY 0 -> -42`, `rotate 0 -> -1.2deg`.
- Soft elliptical shadow under the object (`opacity 0 -> 0.30`,
  `scaleX 0.75 -> 1.05`).
- This mode is not exercised today (no backend segmentation yet).

### Label (premium, no blobs)

Under the photo (top ~74% of the card):

- success: machine name (`#111111`, fontSize ~30, fontWeight `900`, light
  textShadow) + "Machine détectée" (`#6B6B6B`, 16) + small discrete
  "À confirmer" pill if `needsConfirmation`.
- loading: "Analyse de la machine…" + spinner.
- error: "Analyse impossible" + "Réessaie ou reprends une photo."

No large gray pill, no decorative shapes behind the title.

### Timeline (~1800-2200ms)

```txt
0-300    photo natural
300-800  bright card + fragments appear
800-1300 photo/card settles, drop shadow visible
1300-1800 premium label appears
1800+    result card slides in (screen FadeInUp, delay ~1300ms after success)
```

No artificial delay on the recognition itself; the result card is delayed
only visually so the reveal reads first. No infinite animations after
success.

### Error / fallback

- On error the reveal aborts: "Analyse impossible" shows and the error
  card appears below — error state is never blocked.
- If the image fails to load, a clean bright card is shown with the
  loading/error label; no crash.

### Skipped (deferred)

- Real segmentation, real cutout generation, true silhouette shadow,
  background blur, Skia layers (V3).

## Phase 6.4 — CapWords flow alignment

QA decision:

- camera preview must be full-screen (no black side bars)
- scan result must include a validation stage before details
- without cutoutUri, never fake object segmentation and never squeeze the
  photo
- validation stage matches CapWords-style centered object/card, glow,
  label, and confirm/retake/reject actions
- details and save appear only after validation

### Camera screen (`CameraCapture`)

- Full-screen camera preview (`CameraView` with `StyleSheet.absoluteFillObject`),
  no horizontal padding / no black side bars.
- Subtle dark scrim for overlay readability; controls are overlay only and
  do not compress the preview.
- Scan frame: 4 white corner brackets around a centered placement area,
  with the instruction `Place la machine dans le cadre`.
- Bottom: a premium circular capture button (white ring + inner white
  disc), with `Annuler` (top-left) to go home. Safe-area aware
  (`useSafeAreaInsets`).
- Permission / denied / mount-error states preserved.

### Scan-result flow (`src/app/scan-result.tsx`)

Three visual states (+ error):

```txt
A. loading  -> photo card (contain, no squeeze) + "Analyse de la machine…"
B. validation -> ScanValidationStage (CapWords-like)
C. details  -> MachineResultCard + save (only after validation)
```

A local `isValidated` state gates the details: the full fiche and save
button are not shown until the user confirms the recognition.

### Validation stage (`ScanValidationStage`)

Props:

```ts
type ScanValidationStageProps = {
  imageUri: string;
  cutoutUri?: string;
  machineName: string;
  machineSubtitle?: string;
  needsConfirmation?: boolean;
  onConfirm: () => void;
  onRetake: () => void;
  onReject?: () => void;
};
```

- Light background `#F8F8F5`.
- Soft yellow glow behind the object/card (two stacked rounded Views).
- Without `cutoutUri`: the full photo is shown in a stable-ratio card
  (`aspectRatio: 4/3`, `contentFit: 'contain'`) — no squeeze, no fake
  cutout. With `cutoutUri`: the real detoured object is shown.
- Premium label under the object: machine name (`#111`, fontWeight `900`,
  ~30, light textShadow) + subtitle + small "À confirmer" pill.
- Actions (`ScanValidationActions`): `Refaire` (left), `Valider` (center,
  primary), `Rejeter` (right). Discrete hint below: `Pas ce que vous
  attendiez ? Reprendre la photo`.
- Entrance: `ZoomIn` on the object/card.

### Image rendering rules

- Always `contentFit: 'contain'` inside a stable-ratio container.
- Never force a conflicting width/height that squeezes the photo.
- Never crop a central vignette pretending to be a cutout.
- With a real `cutoutUri`, show the transparent object with glow + shadow.

### Timeline

- Loading state shows immediately; on recognition success the validation
  stage appears (entrance ~480ms). No artificial delay on recognition.
- After the user presses `Valider`, the details fiche slides in
  (`FadeInUp`).





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
