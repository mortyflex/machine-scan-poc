import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  Blur,
  Canvas,
  Circle,
  Fill,
  Group,
  Image,
  Oval,
  RadialGradient,
  RoundedRect,
  useImage,
} from '@shopify/react-native-skia';
import Animated, { ZoomIn } from 'react-native-reanimated';

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

          {/* Soft shadow under the object */}
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

          {useRealCutout ? (
            <Image
              image={cutoutImage}
              x={layout.objX}
              y={layout.objY}
              width={layout.objW}
              height={layout.objH}
              fit="contain"
            />
          ) : (
            <Group>
              <RoundedRect
                x={layout.cardX}
                y={layout.cardY}
                width={layout.cardW}
                height={layout.cardH}
                r={18}
                color="#FFFFFF"
              />
              {photoImage ? (
                <Image
                  image={photoImage}
                  x={layout.cardX + 8}
                  y={layout.cardY + 8}
                  width={layout.cardW - 16}
                  height={layout.cardH - 16}
                  fit="contain"
                />
              ) : null}
            </Group>
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

  // Shadow (soft ellipse below the object)
  const shadowW = w * 0.5;
  const shadowH = 26;
  const shadowX = (w - shadowW) / 2;
  const shadowY = objY + objH - 6;

  // Photo fallback card (stable ratio, no squeeze)
  const cardW = Math.min(w * 0.84, 340);
  const cardH = cardW * 0.74;
  const cardX = (w - cardW) / 2;
  const cardY = cy - cardH / 2;

  if (useRealCutout) {
    return {
      dots,
      glowCx: cx,
      glowCy,
      glowR,
      shadowX,
      shadowY,
      shadowW,
      shadowH,
      objX,
      objY,
      objW,
      objH,
      cardX: 0,
      cardY: 0,
      cardW: 0,
      cardH: 0,
    };
  }

  return {
    dots,
    glowCx: cx,
    glowCy,
    glowR,
    shadowX: (w - shadowW) / 2,
    shadowY: cardY + cardH - 8,
    shadowW,
    shadowH,
    objX: 0,
    objY: 0,
    objW: 0,
    objH: 0,
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
