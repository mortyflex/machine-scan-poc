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

## Phase 6.5 — Skia cutout renderer

QA decision:

- CapWords-like validation requires a real object cutout renderer
- Skia is introduced for the validation visual layer
- `cutoutUri` is the source of truth for real cutout display
- without `cutoutUri`, the app shows an honest photo fallback
- no fake rectangle segmentation is allowed

### `SkiaCutoutStage` (pure visual, no navigation/SQLite/AI)

```ts
type SkiaCutoutStageProps = {
  imageUri: string;
  cutoutUri?: string;
  machineName: string;
  machineSubtitle?: string;
  needsConfirmation?: boolean;
  mode?: 'real-cutout' | 'photo-fallback';
};
```

Renders a Skia `Canvas` filling the object area:

- `Fill` background `#F8F8F5`.
- Sparse subtle dotted pattern (small low-opacity circles on a 30px grid).
- Soft yellow radial `RadialGradient` glow behind the object
  (`rgba(255,233,168,..) -> rgba(248,248,245,0)`).
- Soft elliptical shadow under the object (`Oval` + `Blur`).
- Real-cutout mode (`cutoutUri` provided, image loaded via `useImage`):
  the transparent cutout image is drawn centered with `fit="contain"`
  (~52% of canvas height), floating above the glow/shadow. No white card,
  no fake cutout. If the cutout image fails to load, the stage silently
  falls back to `photo-fallback`.
- Photo-fallback mode (no `cutoutUri`, or cutout load failure): a stable-
  ratio white `RoundedRect` card (width ≤ 84% / 340px, ratio 0.74) with
  the original photo drawn `fit="contain"` inside (inset 8px) — no squeeze,
  no crop, no fake cutout. A discrete `Détourage bientôt disponible` hint
  appears under the label.

### Label (React Native, overlaid below the Canvas)

- machine name `#111`, fontWeight `900`, ~30, light textShadow.
- subtitle (e.g. machine type), `#6B6B6B`, 16.
- small discrete "À confirmer" pill if `needsConfirmation`.
- No gray blobs/pipes behind the title.

### Actions (React Native, in `ScanValidationStage`, not Skia)

`Refaire` / `Valider` (primary) / `Rejeter` + discrete hint, unchanged.

### Future-ready

When a backend segmentation provides a real `cutoutUri`, the same stage
renders the true detoured object with glow + shadow — no code change
needed. No cutout is generated on-device in this phase.

### Compatibility

- Uses `@shopify/react-native-skia` 2.2.12 (already installed), no extra
  native module, no prebuild.
- If a real Skia runtime error occurred, the previous RN-only
  `ScanValidationStage` render is recoverable via git; documented as a
  fallback.

## Phase 6.6 — Real cutoutUri generation

QA decision:

- layout and Skia renderer are not enough
- CapWords-like validation requires a real transparent object cutout
- mobile app now requests the cutout from backend
- server-side provider generates a transparent PNG/WebP
- Skia renders cutoutUri when available
- fallback photo-card is used only when cutout is unavailable
- no secret is exposed in mobile code

Pipeline:

```txt
photo capture
→ recognition success
→ generateMachineCutout(imageUri)   (EXPO_PUBLIC_CUTOUT_PROVIDER=remote)
→ POST /api/machine-cutout (base64 JSON, secret key server-side)
→ transparent PNG written to machine-scan-cutouts/ (document dir)
→ SkiaCutoutStage real-cutout mode (glow + shadow + label)
→ user validates → details show the cutout → save persists cutoutUri
```

States:

- `EXPO_PUBLIC_CUTOUT_PROVIDER=disabled` (default): no backend call, the
  validation stage shows the honest photo fallback with the discrete hint
  `Détourage indisponible`.
- `remote` + backend working: a brief `Détourage de l'objet…` loading
  stage, then the real detoured object.
- `remote` + backend down/failed: non-blocking, honest fallback (same as
  disabled). Errors never block validation.

Details / saved screens:

- Details top visual: real cutout on a light stage with soft shadow when
  available, otherwise the clean full photo (contain, never squeezed).
- Saved list thumbnails and saved detail prefer `cutoutUri`, falling back
  to `imageUri`.

## Phase 6.6.1 — Cutout mobile trigger debug and fallback display

QA finding:

- backend `/health` was reachable from iPhone
- no `POST /api/machine-cutout` appeared during scan
- issue is on mobile trigger/env/config side, not remove.bg
- added dev-only cutout debug panel and logs
- improved no-cutout fallback from narrow vertical photo to wide
  cover-style photo card

Fallback photo card (validation stage, no `cutoutUri`):

- White card: width 86% of the canvas (max 380), height clamped
  ~250–320px, borderRadius 30, soft shadow below.
- The photo fills the whole card with a Skia `fit="cover"` crop (aspect
  ratio preserved, centered, rounded-corner clip) — no more narrow
  vertical photo strip inside a big white rectangle.
- `cover` is allowed here only as an aesthetic fallback composition; it
  is never presented as a real cutout. The discrete hint
  `Détourage indisponible` stays, and the real-cutout mode (glow +
  shadow + transparent object, no card) is unchanged.

Dev-only debug panel (`CutoutDebugPanel`, gated behind `__DEV__`):

```txt
Cutout debug
provider: <remote|disabled>
api: <apiBaseUrl|empty>
status: <idle|loading|success|failed|disabled>
error: <kind|none>
provider status: <externalHttpStatus>   (when available)
provider message: <safe preview>        (when available)
visual mode: <real-cutout|photo-fallback-cover>
[Relancer le détourage]  (only when failed/disabled)
```

## Phase 6.6.2 — Backend cutout diagnostics and no-cutout visual consistency

QA finding:

- mobile app reads remote env correctly
- mobile app reaches backend (POST logged)
- backend did not expose enough safe diagnostics for remove.bg failures
- loading state still displayed a narrow vertical photo inside a white card
- added backend provider logs, safe debug endpoint, provider status
  propagation, and shared wide cover-style no-cutout photo fallback

Unified no-cutout rule (all screens):

```txt
if cutoutUri exists:
  render real transparent cutout (unchanged: glow, shadow, no card)

else:
  render PhotoFallbackCard — wide cover-style photo filling a premium
  white card; aesthetic crop allowed; never presented as a cutout
```

`PhotoFallbackCard` (shared component):

- White card, `overflow: hidden`, soft drop shadow, photo fills the card
  with `contentFit="cover"` (no deformation, centered crop).
- Variants: `loading` / `validation` (width 86%, max 380, height 280,
  radius 30) and `details` (full width, height 280, radius 24).
- Used by: recognition loading, cutout loading (`Détourage de l'objet…`),
  details fallback, saved detail fallback. The Skia validation fallback
  keeps its own equivalent cover-crop rendering (Phase 6.6.1). Saved list
  keeps its small cover thumbnail.
- The dev debug panel reports `visual mode: photo-fallback-cover` for
  every no-cutout state (loading included).

## Phase 6.6.4 — Cutout UX polish and debug cleanup

QA decision:

- remote cutout pipeline is validated on iPhone
- debug panel is no longer needed in normal UI
- loading state should feel intentional and premium
- added analysis sparkle effect while cutout is being generated
- added reveal transition from photo fallback to real cutout
- added subtle sticker-style border/glow for real cutout

### Debug cleanup

- `CutoutDebugPanel` stays in the codebase but is disabled by default:
  `SHOW_CUTOUT_DEBUG_PANEL = false` in
  `src/features/machine-scan/cutout/cutout-debug.ts` (dev-only even when
  re-enabled).
- Verbose pipeline success logs are gated behind
  `CUTOUT_DEBUG_LOGS_ENABLED = false` (`logCutoutDebug`); error logs stay
  dev-only via `warnCutoutDebug`. Never base64, never secrets.
- Normal UI shows only product texts: `Analyse de la machine…`,
  `Détourage de l'objet…`, `Détourage indisponible`.

### Analysis effect (`CutoutAnalysisEffect`)

During recognition and cutout loading:

```txt
cover-style photo card (PhotoFallbackCard)
+ subtle diagonal shimmer band (Skia LinearGradient, ~2.6 s loop)
+ 12 deterministic sparkles (white / pale yellow, r 1.2–2.4,
  slow sine opacity + tiny vertical drift, no aggressive blinking)
+ spinner + short label below
```

Driven by a single Skia `useClock`; sparkle positions are a fixed table
(no random per render). The overlay unmounts with the loading stage, so
nothing keeps animating afterwards.

### Reveal transition (in `SkiaCutoutStage`)

When `cutoutUri` becomes displayable (image decoded), a one-shot ~900 ms
reveal plays (Reanimated `withTiming`, ease-out cubic):

```txt
photo card (cover) visible
→ card + photo dissolve (opacity 1 → 0 over the first ~55%)
→ 14 deterministic dust fragments ramp in, drift outward/upward with
  ease-out, and fade to zero (Telegram-style dust, sober off-white)
→ cutout layer fades in (25%→75% of the timeline) with a slight
  translateY settle (14 → 0)
→ stable end state: cutout + glow + soft shadow, no looping particles
```

- Plays exactly once per stage mount (`hasRevealed` ref); if the cutout
  is already available on mount, the same short reveal plays from the
  photo card — never an infinite loop.
- Without `cutoutUri` the progress stays at 0 and the honest cover
  fallback renders exactly as in Phase 6.6.2, with
  `Détourage indisponible`.

### Sticker-style cutout

The real cutout is drawn as a sticker:

```txt
white silhouette copies (BlendColor srcIn, rgba(255,255,255,0.85))
at offsets (±1.5, 0), (0, ±1.5), (±1, ±1) behind the image
→ subtle contour hugging the PNG alpha
+ soft yellow radial glow behind
+ soft elliptical shadow below
+ sharp cutout on top
```

No huge halo, no rectangle border; the contour follows the silhouette
because it reuses the cutout's own alpha channel.





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

## Phase 6.6.5 — Premium cutout reveal staging

QA finding:

- real cutout pipeline works
- cutout rendering was too small and too flat
- dust/background disappearance effect was not visible
- sticker border was invisible
- this phase enlarges the cutout, improves the premium background, adds a
  visible dust reveal, and strengthens the sticker-style outline

Staging spec (validation, `SkiaCutoutStage`):

```txt
cutout target: 62% of stage height, 92% of stage width, fit contain
background base: #F8F8F5 + warm vertical tint
primary glow: rgba(255,214,92,0.35) radial core
secondary glow: rgba(255,244,205,0.65) wide radial
dotted pattern: r 1.4 px, step 26 px, rgba(60,55,40,0.11)
ground shadow: rgba(0,0,0,0.24), blur 20
sticker border: 12 white silhouette offsets (±5, ±4 diag, ±2)
               + blurred white halo (blur 9, opacity 0.9)
```

Reveal (one-shot, `CutoutRevealTransition`):

```txt
trigger: cutout becomes displayable (once, guarded by ref)
hold: 320 ms — original photo still visible
duration: 1050 ms, ease-out cubic
photo: opacity 1 → 0 (gone by ~60%), scale 1 → 1.06
cutout: opacity 0 → 1, translateY 16 → 0, scale 0.92 → 1
dust: 52 deterministic fragments (seeded PRNG, module scope)
      radial escape 34–140 px + upward lift, sizes ~2.4–6 px
      white / cream / pale yellow / light gray
      ~35% square fragments with slight rotation
      drawn above the dissolving photo, never masked
after: everything static, no loops, actions usable
```

Details showcase (`CutoutDisplayStage`):

```txt
same premium stage, static (progress pinned at 1)
no label, no dust, cutout at 74% of stage height
reused by scan-result details and saved machine detail
```

Analysis state (`CutoutAnalysisEffect`):

```txt
shimmer: band 120 px, peak rgba(255,255,255,0.38), period 1.9 s
sparkles: 16, r 1.5–2.8, opacity 0.18–0.80
```

Fallback without cutout is unchanged: honest cover photo card, no dust,
no sticker border, "Détourage indisponible".

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

Staging spec (supersedes the 6.6.5 values):

```txt
cutout validation: 74% of stage height, 96% of stage width, fit contain
cutout details: 82% of stage height, 98% of stage width, stage 380 px
primary glow: rgba(255,214,92,0.46) core, radius 0.58·min(w,h)
secondary glow: rgba(255,244,205,0.72) wide radial
ground shadow: rgba(0,0,0,0.32), blur 26, near cutout bottom
sticker border: 16 white silhouette offsets (±8, ±6 diag, ±4, ±3 diag)
               + white halo (blur 12, full opacity) → ~8 px die-cut edge
```

Dust reveal (supersedes the 6.6.5 values):

```txt
hold: 300 ms — original photo still visible
duration: 1500 ms, ease-out cubic
particles: 84 deterministic fragments (seeded PRNG, module scope)
sizes: ~3–7 px, start opacity 0.85–1
travel: 60–190 px radial + 40–140 px upward lift
opacity curve: fast ramp-in, long visible flight, dissolve near the end
drawn above the dissolving photo, one-shot, no loops after
```

Orbit beam (`CutoutOrbitBeam`, validation only):

```txt
thin ellipse stroke (3 px) around the cutout zone
sweep gradient white/pale yellow, bright head dot riding the beam
full rotation ~5.6 s, gentle breathing opacity (~0.36–0.64)
fades in once reveal progress > 80%, runs while validation is shown
Skia clock driven — no JS timers; unmounts with the screen
never shown in details, fallback, or when the cutout failed
```

Analysis state (supersedes the 6.6.5 values):

```txt
shimmer: band 68 px, peak rgba(255,255,255,0.30), period 2.1 s
sparkles: 20, r 1.1–1.9, individual twinkle speeds (~0.9–1.5 s cycles)
opacity 0.18–0.85 with sharpened sine — glints, not floating dots
```

Validation actions:

```txt
confirm: graphite pill (#161616, radius 999, h 58), yellow check badge,
         soft drop shadow, press scale 0.97
side: translucent white pills (0.88) with hairline border, soft shadow,
      camera / close icons + labels
```
