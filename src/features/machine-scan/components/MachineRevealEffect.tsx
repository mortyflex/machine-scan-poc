import { Image } from 'expo-image';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

export type MachineRevealEffectLevel = 'basic' | 'pseudo-cutout';

export type MachineRevealEffectProps = {
  imageUri: string;
  machineName?: string;
  status: 'loading' | 'success' | 'error';
  needsConfirmation?: boolean;
  effectLevel?: MachineRevealEffectLevel;
  /**
   * Future-ready.
   * When a backend segmentation exists, this will be a transparent PNG/WebP
   * of the detected object/machine.
   * For now it will usually be undefined.
   */
  cutoutUri?: string;
};

type Size = { width: number; height: number };

type FragmentConfig = {
  id: string;
  startX: number;
  startY: number;
  tx: number;
  ty: number;
  size: number;
  rotate: number;
  delay: number;
  color: string;
  front: boolean;
};

const EASE_OUT = Easing.out(Easing.quad);
const EASE_IN_OUT = Easing.inOut(Easing.quad);

const FRAGMENT_COUNT = 32;
const FRAGMENT_SIZES = [4, 6, 7, 9, 12];
const FRAGMENT_COLORS = [
  '#EDEDEA',
  '#D9D9D6',
  '#C9C9C4',
  '#BFC2BB',
  'rgba(220,220,216,0.65)',
  'rgba(255,255,255,0.8)',
];

const BRIGHT_BG = '#FAFAFA';
const OBJECT_TEXT = '#1A1A1A';
const OBJECT_SUBTEXT = '#6B6B6B';
const SHADOW_COLOR = '#1A1A1A';

export function MachineRevealEffect({
  imageUri,
  machineName,
  status,
  needsConfirmation,
  effectLevel = 'pseudo-cutout',
  cutoutUri,
}: MachineRevealEffectProps) {
  const [size, setSize] = useState<Size | null>(null);
  const [imageFailed, setImageFailed] = useState(false);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize((prev) =>
      prev && prev.width === width && prev.height === height
        ? prev
        : { width, height },
    );
  };

  if (effectLevel === 'basic') {
    return (
      <BasicReveal
        imageUri={imageUri}
        imageFailed={imageFailed}
        onImageError={() => setImageFailed(true)}
        onLayout={onLayout}
        status={status}
        machineName={machineName}
        needsConfirmation={needsConfirmation}
      />
    );
  }

  return (
    <PseudoCutoutReveal
      imageUri={imageUri}
      cutoutUri={cutoutUri}
      imageFailed={imageFailed}
      onImageError={() => setImageFailed(true)}
      size={size}
      onLayout={onLayout}
      status={status}
      machineName={machineName}
      needsConfirmation={needsConfirmation}
    />
  );
}

type CommonProps = {
  imageUri: string;
  imageFailed: boolean;
  onImageError: () => void;
  onLayout: (e: LayoutChangeEvent) => void;
  status: 'loading' | 'success' | 'error';
  machineName?: string;
  needsConfirmation?: boolean;
};

/* -------------------------------------------------------------------------- */
/* Pseudo-cutout reveal (CapWords-like)                                        */
/* -------------------------------------------------------------------------- */

function PseudoCutoutReveal({
  imageUri,
  cutoutUri,
  imageFailed,
  onImageError,
  size,
  onLayout,
  status,
  machineName,
  needsConfirmation,
}: CommonProps & {
  cutoutUri?: string;
  size: Size | null;
}) {
  const bgPhotoOpacity = useSharedValue(1);
  const brightBgOpacity = useSharedValue(0);
  const dustVeilOpacity = useSharedValue(0);
  const cutoutScale = useSharedValue(1);
  const cutoutTranslateY = useSharedValue(0);
  const cutoutTranslateX = useSharedValue(0);
  const cutoutRotate = useSharedValue(0);
  const edgeGlowOpacity = useSharedValue(0);
  const shadowOpacity = useSharedValue(0);
  const shadowScale = useSharedValue(0.75);
  const labelOpacity = useSharedValue(0);
  const labelTranslateY = useSharedValue(8);
  const labelScale = useSharedValue(0.96);
  const captionOpacity = useSharedValue(1);

  useEffect(() => {
    // Dissolve (250 - 1200ms)
    bgPhotoOpacity.value = withDelay(250, withTiming(0.08, { duration: 950, easing: EASE_IN_OUT }));
    brightBgOpacity.value = withDelay(250, withTiming(1, { duration: 950, easing: EASE_IN_OUT }));
    dustVeilOpacity.value = withDelay(
      250,
      withSequence(withTiming(0.4, { duration: 350 }), withTiming(0, { duration: 600 })),
    );
    // Cutout detaches (600 - 1550ms)
    cutoutScale.value = withDelay(600, withTiming(1.13, { duration: 950, easing: EASE_OUT }));
    cutoutTranslateY.value = withDelay(600, withTiming(-42, { duration: 950, easing: EASE_OUT }));
    cutoutTranslateX.value = withDelay(600, withTiming(4, { duration: 950, easing: EASE_OUT }));
    cutoutRotate.value = withDelay(600, withTiming(-1.2, { duration: 1000, easing: EASE_IN_OUT }));
    edgeGlowOpacity.value = withDelay(650, withTiming(1, { duration: 500 }));
    // Shadow appears as the object floats (1200 - 1700ms)
    shadowOpacity.value = withDelay(1200, withTiming(0.3, { duration: 500, easing: EASE_OUT }));
    shadowScale.value = withDelay(1200, withTiming(1.05, { duration: 500, easing: EASE_OUT }));
  }, [
    bgPhotoOpacity,
    brightBgOpacity,
    dustVeilOpacity,
    cutoutScale,
    cutoutTranslateY,
    cutoutTranslateX,
    cutoutRotate,
    edgeGlowOpacity,
    shadowOpacity,
    shadowScale,
  ]);

  useEffect(() => {
    if (status === 'success' && machineName) {
      // Label (1700 - 2200ms)
      labelOpacity.value = withDelay(1700, withTiming(1, { duration: 500, easing: EASE_OUT }));
      labelTranslateY.value = withDelay(1700, withTiming(0, { duration: 500, easing: EASE_OUT }));
      labelScale.value = withDelay(1700, withTiming(1, { duration: 500, easing: EASE_OUT }));
      captionOpacity.value = withTiming(0, { duration: 300 });
    } else if (status === 'error') {
      bgPhotoOpacity.value = withTiming(1, { duration: 300 });
      brightBgOpacity.value = withTiming(0, { duration: 300 });
      dustVeilOpacity.value = withTiming(0, { duration: 200 });
      shadowOpacity.value = withTiming(0, { duration: 200 });
      edgeGlowOpacity.value = withTiming(0, { duration: 200 });
      cutoutScale.value = withTiming(1, { duration: 300 });
      cutoutTranslateY.value = withTiming(0, { duration: 300 });
      cutoutTranslateX.value = withTiming(0, { duration: 300 });
      cutoutRotate.value = withTiming(0, { duration: 300 });
      labelOpacity.value = withTiming(1, { duration: 300 });
      labelTranslateY.value = withTiming(0, { duration: 300 });
      captionOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [
    status,
    machineName,
    bgPhotoOpacity,
    brightBgOpacity,
    dustVeilOpacity,
    shadowOpacity,
    edgeGlowOpacity,
    cutoutScale,
    cutoutTranslateY,
    cutoutTranslateX,
    cutoutRotate,
    labelOpacity,
    labelTranslateY,
    labelScale,
    captionOpacity,
  ]);

  const bgPhotoStyle = useAnimatedStyle(() => ({ opacity: bgPhotoOpacity.value }));
  const brightBgStyle = useAnimatedStyle(() => ({ opacity: brightBgOpacity.value }));
  const dustVeilStyle = useAnimatedStyle(() => ({ opacity: dustVeilOpacity.value }));
  const cutoutStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: cutoutTranslateX.value },
      { scale: cutoutScale.value },
      { translateY: cutoutTranslateY.value },
      { rotate: `${cutoutRotate.value}deg` },
    ],
  }));
  const edgeGlowStyle = useAnimatedStyle(() => ({ opacity: edgeGlowOpacity.value }));
  const labelStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
    transform: [{ translateY: labelTranslateY.value }, { scale: labelScale.value }],
  }));
  const captionStyle = useAnimatedStyle(() => ({ opacity: captionOpacity.value }));

  const geometry = useMemo(() => computeGeometry(size), [size]);
  const fragments = useMemo(() => buildFragments(geometry), [geometry]);
  const backFragments = useMemo(() => fragments.filter((f) => !f.front), [fragments]);
  const frontFragments = useMemo(() => fragments.filter((f) => f.front), [fragments]);

  const hasCutout = !imageFailed && size !== null;

  return (
    <View onLayout={onLayout} style={styles.container}>
      {/* Layer 1 — original photo background (fades out) */}
      {!imageFailed ? (
        <Animated.View style={[styles.fullFill, bgPhotoStyle]}>
          <Image
            source={{ uri: imageUri }}
            style={styles.fullFill}
            contentFit="cover"
            onError={onImageError}
          />
        </Animated.View>
      ) : null}

      {/* Bright neutral background (fades in) */}
      <Animated.View
        style={[styles.fullFill, { backgroundColor: BRIGHT_BG }, brightBgStyle]}
        pointerEvents="none"
      />

      {/* Layer 2 — dissolve / dust veil */}
      <Animated.View style={[styles.fullFill, styles.dustVeil, dustVeilStyle]} pointerEvents="none" />

      {/* Back fragments (behind the object) */}
      {hasCutout
        ? backFragments.map((fragment) => (
            <Fragment key={fragment.id} config={fragment} />
          ))
        : null}

      {/* Layer 4 — soft elliptical shadow under the floating object */}
      {hasCutout ? (
        <SoftShadow
          geometry={geometry}
          opacityRef={shadowOpacity}
          scaleRef={shadowScale}
        />
      ) : null}

      {/* Layer 3 — pseudo-cutout object layer */}
      {hasCutout ? (
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              left: geometry.focusLeft,
              top: geometry.focusTop,
              width: geometry.focusWidth,
              height: geometry.focusHeight,
            },
            cutoutStyle,
          ]}
        >
          {/* outer soft halo (peeks around the cutout) */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.edgeHalo,
              {
                top: -8,
                left: -8,
                width: geometry.focusWidth + 16,
                height: geometry.focusHeight + 16,
                borderRadius: geometry.focusRadius + 8,
              },
              edgeGlowStyle,
            ]}
          />
          {cutoutUri ? (
            <Image
              source={{ uri: cutoutUri }}
              style={styles.fullFill}
              contentFit="contain"
            />
          ) : (
            <View
              style={[
                styles.clip,
                {
                  width: geometry.focusWidth,
                  height: geometry.focusHeight,
                  borderRadius: geometry.focusRadius,
                },
              ]}
            >
              <Image
                source={{ uri: imageUri }}
                style={{
                  position: 'absolute',
                  left: -geometry.focusLeft,
                  top: -geometry.focusTop,
                  width: geometry.containerWidth,
                  height: geometry.containerHeight,
                }}
                contentFit="cover"
              />
            </View>
          )}
          {/* main edge border */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.edgeGlow,
              {
                width: geometry.focusWidth,
                height: geometry.focusHeight,
                borderRadius: geometry.focusRadius,
              },
              edgeGlowStyle,
            ]}
          />
          {/* inner highlight */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.edgeHighlight,
              {
                top: 4,
                left: 4,
                width: geometry.focusWidth - 8,
                height: geometry.focusHeight - 8,
                borderRadius: Math.max(geometry.focusRadius - 6, 8),
              },
              edgeGlowStyle,
            ]}
          />
        </Animated.View>
      ) : null}

      {/* Front fragments (above the object) */}
      {hasCutout
        ? frontFragments.map((fragment) => (
            <Fragment key={fragment.id} config={fragment} />
          ))
        : null}

      {/* Layer 5 — recognition label */}
      <Animated.View
        style={[styles.labelContainer, labelStyle]}
        pointerEvents="none"
      >
        {status === 'success' && machineName ? (
          <View style={styles.labelContent}>
            <Text style={styles.machineName}>{machineName}</Text>
            <Text style={styles.subLabel}>Machine détectée</Text>
            {needsConfirmation ? (
              <View style={styles.confirmPill}>
                <Text style={styles.confirmText}>À confirmer</Text>
              </View>
            ) : null}
          </View>
        ) : null}
        {status === 'error' ? (
          <View style={styles.labelContent}>
            <Text style={styles.errorTitle}>Analyse impossible</Text>
            <Text style={styles.subLabel}>Réessaie ou reprends une photo.</Text>
          </View>
        ) : null}
      </Animated.View>

      {/* Loading caption */}
      <Animated.View
        style={[styles.captionContainer, captionStyle]}
        pointerEvents="none"
      >
        <ActivityIndicator color={OBJECT_SUBTEXT} size="small" />
        <Text style={styles.captionText}>Analyse de la machine…</Text>
      </Animated.View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Soft shadow (multi-layer, blur-simulated)                                   */
/* -------------------------------------------------------------------------- */

function SoftShadow({
  geometry,
  opacityRef,
  scaleRef,
}: {
  geometry: Geometry;
  opacityRef: SharedValue<number>;
  scaleRef: SharedValue<number>;
}) {
  const outerStyle = useAnimatedStyle(() => ({
    opacity: opacityRef.value * 0.45,
    transform: [{ scaleX: scaleRef.value }],
  }));
  const midStyle = useAnimatedStyle(() => ({
    opacity: opacityRef.value * 0.75,
    transform: [{ scaleX: scaleRef.value }],
  }));
  const coreStyle = useAnimatedStyle(() => ({
    opacity: opacityRef.value,
    transform: [{ scaleX: scaleRef.value }],
  }));

  return (
    <>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.shadowBase,
          {
            left: geometry.shadowOuterLeft,
            top: geometry.shadowTop,
            width: geometry.shadowOuterWidth,
            height: geometry.shadowOuterHeight,
          },
          outerStyle,
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.shadowBase,
          {
            left: geometry.shadowMidLeft,
            top: geometry.shadowTop,
            width: geometry.shadowMidWidth,
            height: geometry.shadowMidHeight,
          },
          midStyle,
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.shadowBase,
          {
            left: geometry.shadowInnerLeft,
            top: geometry.shadowTop,
            width: geometry.shadowInnerWidth,
            height: geometry.shadowInnerHeight,
          },
          coreStyle,
        ]}
      />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Basic reveal fallback                                                       */
/* -------------------------------------------------------------------------- */

function BasicReveal({
  imageUri,
  imageFailed,
  onImageError,
  onLayout,
  status,
  machineName,
  needsConfirmation,
}: CommonProps) {
  const dimOpacity = useSharedValue(0);
  const labelOpacity = useSharedValue(0);
  const captionOpacity = useSharedValue(1);

  useEffect(() => {
    dimOpacity.value = withDelay(150, withTiming(0.35, { duration: 500 }));
  }, [dimOpacity]);

  useEffect(() => {
    if (status === 'success' && machineName) {
      labelOpacity.value = withDelay(600, withTiming(1, { duration: 400 }));
      captionOpacity.value = withTiming(0, { duration: 300 });
    } else if (status === 'error') {
      labelOpacity.value = withTiming(1, { duration: 300 });
      captionOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [status, machineName, labelOpacity, captionOpacity]);

  const dimStyle = useAnimatedStyle(() => ({ opacity: dimOpacity.value }));
  const labelStyle = useAnimatedStyle(() => ({ opacity: labelOpacity.value }));
  const captionStyle = useAnimatedStyle(() => ({ opacity: captionOpacity.value }));

  return (
    <View onLayout={onLayout} style={[styles.container, { backgroundColor: BRIGHT_BG }]}>
      {!imageFailed ? (
        <Animated.View style={[styles.fullFill, { opacity: 1 }]}>
          <Image
            source={{ uri: imageUri }}
            style={styles.fullFill}
            contentFit="cover"
            onError={onImageError}
          />
        </Animated.View>
      ) : null}
      <Animated.View style={[styles.fullFill, { backgroundColor: '#0B0C0E' }, dimStyle]} pointerEvents="none" />

      <Animated.View style={[styles.labelContainer, labelStyle]} pointerEvents="none">
        {status === 'success' && machineName ? (
          <View style={styles.labelContent}>
            <Text style={styles.machineName}>{machineName}</Text>
            {needsConfirmation ? (
              <View style={styles.confirmPill}>
                <Text style={styles.confirmText}>À confirmer</Text>
              </View>
            ) : null}
          </View>
        ) : null}
        {status === 'error' ? (
          <Text style={styles.errorTitle}>Analyse impossible</Text>
        ) : null}
      </Animated.View>

      <Animated.View style={[styles.captionContainer, captionStyle]} pointerEvents="none">
        <ActivityIndicator color={OBJECT_SUBTEXT} size="small" />
        <Text style={styles.captionText}>Analyse de la machine…</Text>
      </Animated.View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Fragment                                                                    */
/* -------------------------------------------------------------------------- */

function Fragment({ config }: { config: FragmentConfig }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      config.delay,
      withTiming(1, { duration: 800, easing: EASE_OUT }),
    );
  }, [config.delay, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      opacity: interpolate(p, [0, 0.1, 1], [0, 1, 0]),
      transform: [
        { translateX: p * config.tx },
        { translateY: p * config.ty },
        { scale: interpolate(p, [0, 1], [1, 0.4]) },
        { rotate: `${p * config.rotate}deg` },
      ],
    };
  });

  const staticStyle: ViewStyle = {
    left: config.startX,
    top: config.startY,
    width: config.size,
    height: config.size,
    marginLeft: -config.size / 2,
    marginTop: -config.size / 2,
    backgroundColor: config.color,
  };

  return <Animated.View style={[styles.fragment, staticStyle, animatedStyle]} />;
}

/* -------------------------------------------------------------------------- */
/* Geometry + deterministic fragments                                          */
/* -------------------------------------------------------------------------- */

type Geometry = {
  containerWidth: number;
  containerHeight: number;
  focusLeft: number;
  focusTop: number;
  focusWidth: number;
  focusHeight: number;
  focusRadius: number;
  shadowTop: number;
  shadowOuterLeft: number;
  shadowOuterWidth: number;
  shadowOuterHeight: number;
  shadowMidLeft: number;
  shadowMidWidth: number;
  shadowMidHeight: number;
  shadowInnerLeft: number;
  shadowInnerWidth: number;
  shadowInnerHeight: number;
  centerX: number;
  centerY: number;
  rx: number;
  ry: number;
};

function computeGeometry(size: Size | null): Geometry {
  const containerWidth = size?.width ?? 0;
  const containerHeight = size?.height ?? 0;
  const focusWidth = containerWidth * 0.9;
  const focusHeight = containerHeight * 0.58;
  const focusLeft = (containerWidth - focusWidth) / 2;
  const focusTop = containerHeight * 0.15;
  const focusRadius = 48;
  const centerX = containerWidth * 0.5;
  const centerY = containerHeight * 0.44;
  const rx = focusWidth * 0.48;
  const ry = focusHeight * 0.48;

  const shadowTop = focusTop + focusHeight - 14;
  const shadowOuterWidth = containerWidth * 0.66;
  const shadowOuterHeight = 38;
  const shadowOuterLeft = centerX - shadowOuterWidth / 2;
  const shadowMidWidth = containerWidth * 0.55;
  const shadowMidHeight = 28;
  const shadowMidLeft = centerX - shadowMidWidth / 2;
  const shadowInnerWidth = containerWidth * 0.42;
  const shadowInnerHeight = 18;
  const shadowInnerLeft = centerX - shadowInnerWidth / 2;

  return {
    containerWidth,
    containerHeight,
    focusLeft,
    focusTop,
    focusWidth,
    focusHeight,
    focusRadius,
    shadowTop,
    shadowOuterLeft,
    shadowOuterWidth,
    shadowOuterHeight,
    shadowMidLeft,
    shadowMidWidth,
    shadowMidHeight,
    shadowInnerLeft,
    shadowInnerWidth,
    shadowInnerHeight,
    centerX,
    centerY,
    rx,
    ry,
  };
}

function buildFragments(geo: Geometry): FragmentConfig[] {
  if (geo.containerWidth === 0) return [];
  const fragments: FragmentConfig[] = [];
  for (let i = 0; i < FRAGMENT_COUNT; i++) {
    const angle = (i / FRAGMENT_COUNT) * Math.PI * 2 + 0.2;
    const startX = geo.centerX + Math.cos(angle) * geo.rx;
    const startY = geo.centerY + Math.sin(angle) * geo.ry;
    const dist = 24 + (i % 6) * 12;
    const tx = Math.cos(angle) * dist;
    const ty = Math.sin(angle) * dist;
    const size = FRAGMENT_SIZES[i % FRAGMENT_SIZES.length];
    const rotate = ((i % 7) - 3) * 11;
    const delay = 250 + (i % 6) * 30;
    const color = FRAGMENT_COLORS[i % FRAGMENT_COLORS.length];
    const front = i % 4 === 0;
    fragments.push({
      id: `frag-${i}`,
      startX,
      startY,
      tx,
      ty,
      size,
      rotate,
      delay,
      color,
      front,
    });
  }
  return fragments;
}

/* -------------------------------------------------------------------------- */
/* Styles                                                                      */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: BRIGHT_BG,
    overflow: 'hidden',
    borderRadius: 20,
  },
  fullFill: {
    ...StyleSheet.absoluteFillObject,
  },
  dustVeil: {
    backgroundColor: '#FFFFFF',
  },
  shadowBase: {
    position: 'absolute',
    backgroundColor: SHADOW_COLOR,
    borderRadius: 999,
  },
  clip: {
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  edgeHalo: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  edgeGlow: {
    position: 'absolute',
    borderColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1.5,
    top: 0,
    left: 0,
  },
  edgeHighlight: {
    position: 'absolute',
    borderColor: 'rgba(255,255,255,0.55)',
    borderWidth: 1,
  },
  fragment: {
    position: 'absolute',
    borderRadius: 1,
  },
  labelContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '72%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  labelContent: {
    alignItems: 'center',
    gap: 4,
  },
  machineName: {
    color: OBJECT_TEXT,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  subLabel: {
    color: OBJECT_SUBTEXT,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  confirmPill: {
    marginTop: 6,
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
  errorTitle: {
    color: '#C0392B',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  captionContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '72%',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
  captionText: {
    color: OBJECT_SUBTEXT,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    textShadowColor: 'rgba(250,250,250,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
});
