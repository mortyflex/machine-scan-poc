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
  LinearGradient,
  Oval,
  RadialGradient,
  Rect,
  RoundedRect,
  rect,
  rrect,
  vec,
  useImage,
} from '@shopify/react-native-skia';
import Animated, {
  Easing,
  ZoomIn,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { CutoutOrbitBeam } from './CutoutOrbitBeam';
import {
  CutoutRevealDust,
  REVEAL_DELAY_MS,
  REVEAL_DURATION_MS,
} from './CutoutRevealTransition';

export type SkiaCutoutStageProps = {
  imageUri: string;
  cutoutUri?: string;
  machineName: string;
  machineSubtitle?: string;
  needsConfirmation?: boolean;
  mode?: 'real-cutout' | 'photo-fallback';
  /**
   * 'validation' (default): full stage with label, one-shot dust reveal.
   * 'details': static showcase — same premium background, sticker border
   * and shadow, but no label, no reveal animation, no dust.
   */
  variant?: 'validation' | 'details';
};

type StageSize = { width: number; height: number };

const STAGE_BG = '#F8F8F5';
const TITLE_COLOR = '#111111';
const SUBTITLE_COLOR = '#6B6B6B';
const CARD_RADIUS = 30;

// Sticker illusion (Phase 6.6.6): the cutout silhouette is drawn in solid
// white at offsets around the PNG alpha, giving a clearly visible 7–10 px
// die-cut border, plus one blurred white copy as a soft halo so the border
// reads even against the light background.
const STICKER_OFFSETS: readonly [number, number][] = [
  [-8, 0],
  [8, 0],
  [0, -8],
  [0, 8],
  [-6, -6],
  [6, -6],
  [-6, 6],
  [6, 6],
  [-4, 0],
  [4, 0],
  [0, -4],
  [0, 4],
  [-3, -3],
  [3, -3],
  [-3, 3],
  [3, 3],
];

export function SkiaCutoutStage({
  imageUri,
  cutoutUri,
  machineName,
  machineSubtitle,
  needsConfirmation,
  mode,
  variant = 'validation',
}: SkiaCutoutStageProps) {
  const resolvedMode = mode ?? (cutoutUri ? 'real-cutout' : 'photo-fallback');
  const isDetails = variant === 'details';
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

  // One-shot "dust away" reveal: the photo stays visible for a beat, then
  // dissolves while dust escapes and the cutout scales in. Plays once when
  // the cutout becomes displayable and never loops; without a cutout the
  // progress stays at 0 and the honest fallback renders as before. The
  // details variant skips straight to the settled state.
  const revealProgress = useSharedValue(isDetails ? 1 : 0);
  const hasRevealed = useRef(isDetails);
  useEffect(() => {
    if (useRealCutout && !hasRevealed.current) {
      hasRevealed.current = true;
      revealProgress.value = withDelay(
        REVEAL_DELAY_MS,
        withTiming(1, {
          duration: REVEAL_DURATION_MS,
          easing: Easing.out(Easing.cubic),
        }),
      );
    }
  }, [useRealCutout, revealProgress]);

  const photoOpacity = useDerivedValue(() =>
    Math.max(0, 1 - revealProgress.value * 1.6),
  );
  const photoTransform = useDerivedValue(() => [
    { scale: 1 + revealProgress.value * 0.06 },
  ]);
  const cutoutOpacity = useDerivedValue(() =>
    Math.min(1, Math.max(0, (revealProgress.value - 0.2) / 0.5)),
  );
  const cutoutTransform = useDerivedValue(() => {
    const p = revealProgress.value;
    const eased = Math.min(1, Math.max(0, (p - 0.1) / 0.9));
    return [
      { translateY: (1 - eased) * 16 },
      { scale: 0.92 + 0.08 * eased },
    ];
  });

  const layout = useMemo(
    () => computeLayout(size, useRealCutout, isDetails),
    [size, useRealCutout, isDetails],
  );

  const objCenter = vec(
    layout.objX + layout.objW / 2,
    layout.objY + layout.objH / 2,
  );
  const cardCenter = vec(
    layout.cardX + layout.cardW / 2,
    layout.cardY + layout.cardH / 2,
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

          {/* Subtle warm vertical tint so the stage never reads flat white */}
          {size.height > 0 ? (
            <Rect x={0} y={0} width={size.width} height={size.height}>
              <LinearGradient
                start={vec(0, 0)}
                end={vec(0, size.height)}
                colors={[
                  'rgba(255,250,232,0.0)',
                  'rgba(255,244,205,0.28)',
                  'rgba(255,238,186,0.16)',
                ]}
                positions={[0, 0.62, 1]}
              />
            </Rect>
          ) : null}

          {layout.dots.length > 0 ? (
            <Group>
              {layout.dots.map((d, i) => (
                <Circle
                  key={i}
                  cx={d.x}
                  cy={d.y}
                  r={1.4}
                  color="rgba(60,55,40,0.11)"
                />
              ))}
            </Group>
          ) : null}

          {/* Wide soft cream glow behind the whole object zone */}
          {layout.glowR > 0 ? (
            <Circle
              cx={layout.glowCx}
              cy={layout.glowCy}
              r={layout.glowR * 1.45}
            >
              <RadialGradient
                c={{ x: layout.glowCx, y: layout.glowCy }}
                r={layout.glowR * 1.45}
                colors={[
                  'rgba(255,244,205,0.72)',
                  'rgba(255,247,220,0.38)',
                  'rgba(248,248,245,0)',
                ]}
                positions={[0, 0.55, 1]}
              />
            </Circle>
          ) : null}

          {/* Warmer yellow core glow right behind the object */}
          {layout.glowR > 0 ? (
            <Circle cx={layout.glowCx} cy={layout.glowCy} r={layout.glowR}>
              <RadialGradient
                c={{ x: layout.glowCx, y: layout.glowCy }}
                r={layout.glowR}
                colors={[
                  'rgba(255,214,92,0.46)',
                  'rgba(255,228,148,0.24)',
                  'rgba(248,248,245,0)',
                ]}
                positions={[0, 0.6, 1]}
              />
            </Circle>
          ) : null}

          {useRealCutout ? (
            <>
              {/* Cutout layer: ground shadow + halo + sticker border + object */}
              <Group
                opacity={cutoutOpacity}
                transform={cutoutTransform}
                origin={objCenter}
              >
                {layout.shadowW > 0 ? (
                  <Oval
                    x={layout.shadowX}
                    y={layout.shadowY}
                    width={layout.shadowW}
                    height={layout.shadowH}
                    color="rgba(0,0,0,0.32)"
                  >
                    <Blur blur={26} />
                  </Oval>
                ) : null}
                {/* Soft white halo hugging the silhouette */}
                <Image
                  image={cutoutImage}
                  x={layout.objX}
                  y={layout.objY}
                  width={layout.objW}
                  height={layout.objH}
                  fit="contain"
                >
                  <BlendColor color="#FFFFFF" mode="srcIn" />
                  <Blur blur={12} />
                </Image>
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
                    <BlendColor color="#FFFFFF" mode="srcIn" />
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

              {/* Premium light beam slowly orbiting the sticker while the
                  user decides (validation only, appears after the reveal) */}
              {!isDetails ? (
                <CutoutOrbitBeam
                  cx={layout.objX + layout.objW / 2}
                  cy={layout.objY + layout.objH / 2}
                  rx={layout.objW * 0.44}
                  ry={layout.objH * 0.47}
                  progress={revealProgress}
                />
              ) : null}

              {/* Photo dissolving away above the cutout (validation only) */}
              {!isDetails && photoImage && layout.cardW > 0 ? (
                <Group
                  opacity={photoOpacity}
                  transform={photoTransform}
                  origin={cardCenter}
                >
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

              {/* Dust escaping the dissolving photo, always drawn on top */}
              {!isDetails && layout.cardW > 0 ? (
                <CutoutRevealDust
                  progress={revealProgress}
                  x={layout.cardX}
                  y={layout.cardY}
                  width={layout.cardW}
                  height={layout.cardH}
                />
              ) : null}
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

      {!isDetails ? (
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
      ) : null}
    </View>
  );
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

function computeLayout(
  size: StageSize,
  useRealCutout: boolean,
  isDetails: boolean,
): Layout {
  const { width: w, height: h } = size;
  if (w === 0 || h === 0) return EMPTY_LAYOUT;

  const cx = w / 2;
  const cy = h / 2;

  // Dotted pattern (visible but discreet)
  const dots: { x: number; y: number }[] = [];
  const step = 26;
  for (let y = step / 2; y < h; y += step) {
    for (let x = step / 2; x < w; x += step) {
      dots.push({ x, y });
    }
  }

  // Object area: the cutout is the star of the screen — very large,
  // centered, never distorted (fit contain does the letterboxing).
  const objH = h * (isDetails ? 0.82 : 0.74);
  const objW = w * (isDetails ? 0.98 : 0.96);
  const objX = (w - objW) / 2;
  const objY = cy - objH / 2 - (isDetails ? 0 : h * 0.015);

  // Glow centered on the object zone
  const glowR = Math.min(w, h) * 0.58;
  const glowCy = objY + objH / 2 - h * 0.02;

  // Shadow (soft ellipse below the object or the fallback card)
  const shadowW = w * (useRealCutout ? 0.64 : 0.5);
  const shadowH = 30;
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
    shadowY: useRealCutout ? objY + objH - 14 : cardY + cardH - 8,
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
    paddingTop: 12,
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
