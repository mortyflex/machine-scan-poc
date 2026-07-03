import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  BlendColor,
  Blur,
  Canvas,
  Circle,
  Fill,
  Group,
  Image,
  Oval,
  RadialGradient,
  RoundedRect,
  rect,
  rrect,
  useImage,
} from '@shopify/react-native-skia';
import Animated, {
  Easing,
  ZoomIn,
  useDerivedValue,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

export type SkiaCutoutStageProps = {
  imageUri: string;
  cutoutUri?: string;
  machineName: string;
  machineSubtitle?: string;
  needsConfirmation?: boolean;
  mode?: 'real-cutout' | 'photo-fallback';
};

type StageSize = { width: number; height: number };

const STAGE_BG = '#F8F8F5';
const TITLE_COLOR = '#111111';
const SUBTITLE_COLOR = '#6B6B6B';
const CARD_RADIUS = 30;
const REVEAL_DURATION_MS = 900;

// Sticker illusion: the cutout silhouette is drawn in white at slight
// offsets behind the real image, hugging the alpha of the PNG.
const STICKER_OFFSETS: readonly [number, number][] = [
  [-1.5, 0],
  [1.5, 0],
  [0, -1.5],
  [0, 1.5],
  [-1, -1],
  [1, 1],
];

// Deterministic dust field for the reveal (fractions of the card rect +
// outward drift). Sober off-white fragments, one-shot, never looping.
const REVEAL_PARTICLES = [
  { fx: 0.06, fy: 0.12, dx: -34, dy: -52, r: 2.6, color: 'rgba(255,255,255,0.95)' },
  { fx: 0.18, fy: 0.04, dx: 14, dy: -66, r: 2.0, color: 'rgba(232,232,226,0.9)' },
  { fx: 0.34, fy: 0.09, dx: 30, dy: -58, r: 2.8, color: 'rgba(255,255,255,0.9)' },
  { fx: 0.52, fy: 0.03, dx: 44, dy: -70, r: 1.8, color: 'rgba(240,238,230,0.9)' },
  { fx: 0.68, fy: 0.08, dx: 52, dy: -54, r: 2.4, color: 'rgba(255,255,255,0.95)' },
  { fx: 0.86, fy: 0.05, dx: 62, dy: -64, r: 2.0, color: 'rgba(232,232,226,0.9)' },
  { fx: 0.96, fy: 0.16, dx: 70, dy: -40, r: 2.6, color: 'rgba(255,255,255,0.9)' },
  { fx: 0.04, fy: 0.55, dx: -52, dy: -26, r: 2.2, color: 'rgba(240,238,230,0.9)' },
  { fx: 0.97, fy: 0.48, dx: 64, dy: -22, r: 2.4, color: 'rgba(255,255,255,0.9)' },
  { fx: 0.08, fy: 0.90, dx: -40, dy: 20, r: 2.0, color: 'rgba(232,232,226,0.9)' },
  { fx: 0.30, fy: 0.96, dx: 18, dy: 34, r: 2.4, color: 'rgba(255,255,255,0.9)' },
  { fx: 0.56, fy: 0.93, dx: 36, dy: 28, r: 1.8, color: 'rgba(240,238,230,0.9)' },
  { fx: 0.78, fy: 0.95, dx: 50, dy: 24, r: 2.2, color: 'rgba(255,255,255,0.95)' },
  { fx: 0.92, fy: 0.85, dx: 60, dy: 12, r: 2.0, color: 'rgba(232,232,226,0.9)' },
];

export function SkiaCutoutStage({
  imageUri,
  cutoutUri,
  machineName,
  machineSubtitle,
  needsConfirmation,
  mode,
}: SkiaCutoutStageProps) {
  const resolvedMode = mode ?? (cutoutUri ? 'real-cutout' : 'photo-fallback');
  const [size, setSize] = useState<StageSize>({ width: 0, height: 0 });
  const [cutoutFailed, setCutoutFailed] = useState(false);

  const cutoutImage = useImage(cutoutUri, () => setCutoutFailed(true));
  const photoImage = useImage(imageUri, () => {});

  // If the real cutout fails to load, fall back to the honest photo mode.
  const useRealCutout =
    resolvedMode === 'real-cutout' &&
    Boolean(cutoutUri) &&
    !cutoutFailed &&
    cutoutImage !== null;

  // Re-arm the failure flag if the cutout uri changes.
  useEffect(() => {
    setCutoutFailed(false);
  }, [cutoutUri]);

  // One-shot "dust away" reveal: the photo card dissolves and the real
  // cutout fades in. Plays once when the cutout becomes displayable and
  // never loops; without a cutout the progress stays at 0 and the honest
  // fallback renders as before.
  const revealProgress = useSharedValue(0);
  const hasRevealed = useRef(false);
  useEffect(() => {
    if (useRealCutout && !hasRevealed.current) {
      hasRevealed.current = true;
      revealProgress.value = withTiming(1, {
        duration: REVEAL_DURATION_MS,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [useRealCutout, revealProgress]);

  const photoOpacity = useDerivedValue(() =>
    Math.max(0, 1 - revealProgress.value * 1.8),
  );
  const cutoutOpacity = useDerivedValue(() =>
    Math.min(1, Math.max(0, (revealProgress.value - 0.25) / 0.5)),
  );
  const cutoutLift = useDerivedValue(() => [
    { translateY: (1 - revealProgress.value) * 14 },
  ]);

  const layout = useMemo(
    () => computeLayout(size, useRealCutout),
    [size, useRealCutout],
  );

  return (
    <View style={styles.container}>
      <View
        style={styles.canvasArea}
        onLayout={(e) =>
          setSize({
            width: e.nativeEvent.layout.width,
            height: e.nativeEvent.layout.height,
          })
        }
      >
        <Canvas style={StyleSheet.absoluteFillObject}>
          <Fill color={STAGE_BG} />

          {layout.dots.length > 0 ? (
            <Group>
              {layout.dots.map((d, i) => (
                <Circle
                  key={i}
                  cx={d.x}
                  cy={d.y}
                  r={1.1}
                  color="rgba(0,0,0,0.05)"
                />
              ))}
            </Group>
          ) : null}

          {/* Soft yellow glow behind the object */}
          {layout.glowR > 0 ? (
            <Circle cx={layout.glowCx} cy={layout.glowCy} r={layout.glowR}>
              <RadialGradient
                c={{ x: layout.glowCx, y: layout.glowCy }}
                r={layout.glowR}
                colors={[
                  'rgba(255,233,168,0.55)',
                  'rgba(255,243,207,0.3)',
                  'rgba(248,248,245,0)',
                ]}
                positions={[0, 0.55, 1]}
              />
            </Circle>
          ) : null}

          {useRealCutout ? (
            <>
              {/* Cutout layer: shadow + sticker border + object, fading in */}
              <Group opacity={cutoutOpacity} transform={cutoutLift}>
                {layout.shadowW > 0 ? (
                  <Oval
                    x={layout.shadowX}
                    y={layout.shadowY}
                    width={layout.shadowW}
                    height={layout.shadowH}
                    color="rgba(0,0,0,0.16)"
                  >
                    <Blur blur={18} />
                  </Oval>
                ) : null}
                {STICKER_OFFSETS.map(([dx, dy], i) => (
                  <Image
                    key={i}
                    image={cutoutImage}
                    x={layout.objX + dx}
                    y={layout.objY + dy}
                    width={layout.objW}
                    height={layout.objH}
                    fit="contain"
                  >
                    <BlendColor color="rgba(255,255,255,0.85)" mode="srcIn" />
                  </Image>
                ))}
                <Image
                  image={cutoutImage}
                  x={layout.objX}
                  y={layout.objY}
                  width={layout.objW}
                  height={layout.objH}
                  fit="contain"
                />
              </Group>

              {/* Photo card dissolving away above the cutout */}
              {photoImage && layout.cardW > 0 ? (
                <Group opacity={photoOpacity}>
                  <RoundedRect
                    x={layout.cardX}
                    y={layout.cardY}
                    width={layout.cardW}
                    height={layout.cardH}
                    r={CARD_RADIUS}
                    color="#FFFFFF"
                  />
                  <Group
                    clip={rrect(
                      rect(
                        layout.cardX,
                        layout.cardY,
                        layout.cardW,
                        layout.cardH,
                      ),
                      CARD_RADIUS,
                      CARD_RADIUS,
                    )}
                  >
                    <Image
                      image={photoImage}
                      x={layout.cardX}
                      y={layout.cardY}
                      width={layout.cardW}
                      height={layout.cardH}
                      fit="cover"
                    />
                  </Group>
                </Group>
              ) : null}

              {/* One-shot dust particles carried away with the background */}
              {layout.cardW > 0
                ? REVEAL_PARTICLES.map((particle, i) => (
                    <RevealParticle
                      key={i}
                      progress={revealProgress}
                      x={layout.cardX + particle.fx * layout.cardW}
                      y={layout.cardY + particle.fy * layout.cardH}
                      dx={particle.dx}
                      dy={particle.dy}
                      r={particle.r}
                      color={particle.color}
                    />
                  ))
                : null}
            </>
          ) : (
            <>
              {/* Soft shadow under the fallback card */}
              {layout.shadowW > 0 ? (
                <Oval
                  x={layout.shadowX}
                  y={layout.shadowY}
                  width={layout.shadowW}
                  height={layout.shadowH}
                  color="rgba(0,0,0,0.16)"
                >
                  <Blur blur={18} />
                </Oval>
              ) : null}
              <Group>
                <RoundedRect
                  x={layout.cardX}
                  y={layout.cardY}
                  width={layout.cardW}
                  height={layout.cardH}
                  r={CARD_RADIUS}
                  color="#FFFFFF"
                />
                {/* Honest photo preview, not a cutout: cover-style crop so the
                    photo fills the whole card instead of a narrow contained
                    strip. Aspect ratio is preserved by fit="cover". */}
                {photoImage ? (
                  <Group
                    clip={rrect(
                      rect(
                        layout.cardX,
                        layout.cardY,
                        layout.cardW,
                        layout.cardH,
                      ),
                      CARD_RADIUS,
                      CARD_RADIUS,
                    )}
                  >
                    <Image
                      image={photoImage}
                      x={layout.cardX}
                      y={layout.cardY}
                      width={layout.cardW}
                      height={layout.cardH}
                      fit="cover"
                    />
                  </Group>
                ) : null}
              </Group>
            </>
          )}
        </Canvas>
      </View>

      <Animated.View
        entering={ZoomIn.delay(80).duration(420)}
        style={styles.label}
      >
        <Text style={styles.machineName}>{machineName}</Text>
        {machineSubtitle ? (
          <Text style={styles.subtitle}>{machineSubtitle}</Text>
        ) : null}
        {needsConfirmation ? (
          <View style={styles.confirmPill}>
            <Text style={styles.confirmText}>À confirmer</Text>
          </View>
        ) : null}
        {!useRealCutout ? (
          <Text style={styles.fallbackHint}>Détourage indisponible</Text>
        ) : null}
      </Animated.View>
    </View>
  );
}

/**
 * A single dust fragment of the reveal: ramps in quickly, drifts outward
 * with an ease-out curve, and fades to zero by the end of the reveal —
 * nothing keeps animating on the stable cutout.
 */
function RevealParticle({
  progress,
  x,
  y,
  dx,
  dy,
  r,
  color,
}: {
  progress: SharedValue<number>;
  x: number;
  y: number;
  dx: number;
  dy: number;
  r: number;
  color: string;
}) {
  const cx = useDerivedValue(() => {
    const p = progress.value;
    const eased = 1 - (1 - p) * (1 - p);
    return x + dx * eased;
  });
  const cy = useDerivedValue(() => {
    const p = progress.value;
    const eased = 1 - (1 - p) * (1 - p);
    return y + dy * eased - 24 * p;
  });
  const opacity = useDerivedValue(() => {
    const p = progress.value;
    return Math.min(1, p * 5) * (1 - p) * 0.9;
  });

  return <Circle cx={cx} cy={cy} r={r} color={color} opacity={opacity} />;
}

type Layout = {
  dots: { x: number; y: number }[];
  glowCx: number;
  glowCy: number;
  glowR: number;
  shadowX: number;
  shadowY: number;
  shadowW: number;
  shadowH: number;
  objX: number;
  objY: number;
  objW: number;
  objH: number;
  cardX: number;
  cardY: number;
  cardW: number;
  cardH: number;
};

const EMPTY_LAYOUT: Layout = {
  dots: [],
  glowCx: 0,
  glowCy: 0,
  glowR: 0,
  shadowX: 0,
  shadowY: 0,
  shadowW: 0,
  shadowH: 0,
  objX: 0,
  objY: 0,
  objW: 0,
  objH: 0,
  cardX: 0,
  cardY: 0,
  cardW: 0,
  cardH: 0,
};

function computeLayout(size: StageSize, useRealCutout: boolean): Layout {
  const { width: w, height: h } = size;
  if (w === 0 || h === 0) return EMPTY_LAYOUT;

  const cx = w / 2;
  const cy = h / 2;

  // Dotted pattern (sparse, subtle)
  const dots: { x: number; y: number }[] = [];
  const step = 30;
  for (let y = step / 2; y < h; y += step) {
    for (let x = step / 2; x < w; x += step) {
      dots.push({ x, y });
    }
  }

  // Glow
  const glowR = Math.min(w, h) * 0.42;
  const glowCy = cy - h * 0.04;

  // Object area (45-60% of canvas height)
  const objH = h * 0.52;
  const objW = w * 0.82;
  const objX = (w - objW) / 2;
  const objY = cy - objH / 2;

  // Shadow (soft ellipse below the object or the fallback card)
  const shadowW = w * 0.5;
  const shadowH = 26;
  const shadowX = (w - shadowW) / 2;

  // Photo card: also used as the dissolving source during the reveal, so
  // it is always computed (wide cover crop, no narrow vertical strip).
  const cardW = Math.min(w * 0.86, 380);
  const cardH = Math.min(Math.max(250, h * 0.5), 320, h * 0.75);
  const cardX = (w - cardW) / 2;
  const cardY = cy - cardH / 2;

  return {
    dots,
    glowCx: cx,
    glowCy,
    glowR,
    shadowX,
    shadowY: useRealCutout ? objY + objH - 6 : cardY + cardH - 8,
    shadowW,
    shadowH,
    objX,
    objY,
    objW,
    objH,
    cardX,
    cardY,
    cardW,
    cardH,
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  canvasArea: {
    flex: 1,
    width: '100%',
  },
  label: {
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  machineName: {
    color: TITLE_COLOR,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.4,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  subtitle: {
    color: SUBTITLE_COLOR,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  confirmPill: {
    marginTop: 4,
    backgroundColor: '#FBEEDC',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  confirmText: {
    color: '#9A6B00',
    fontSize: 12,
    fontWeight: '700',
  },
  fallbackHint: {
    marginTop: 6,
    color: '#9A9A96',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});
