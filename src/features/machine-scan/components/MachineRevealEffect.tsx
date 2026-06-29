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
};

const EASE_OUT = Easing.out(Easing.quad);
const EASE_IN_OUT = Easing.inOut(Easing.quad);

const FRAGMENT_COUNT = 28;
const FRAGMENT_COLORS = ['#D9D9D6', '#EDEDEA', '#C9C9C4', '#BFC2BB', '#E3E3DF'];

const BRIGHT_BG = '#FAFAFA';
const OBJECT_TEXT = '#1A1A1A';
const OBJECT_SUBTEXT = '#6B6B6B';

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
  const cutoutRotate = useSharedValue(0);
  const edgeGlowOpacity = useSharedValue(0);
  const shadowOpacity = useSharedValue(0);
  const shadowScale = useSharedValue(0.7);
  const labelOpacity = useSharedValue(0);
  const labelTranslateY = useSharedValue(8);
  const labelScale = useSharedValue(0.96);
  const captionOpacity = useSharedValue(1);

  useEffect(() => {
    bgPhotoOpacity.value = withDelay(350, withTiming(0.08, { duration: 650, easing: EASE_IN_OUT }));
    brightBgOpacity.value = withDelay(350, withTiming(1, { duration: 700, easing: EASE_IN_OUT }));
    dustVeilOpacity.value = withDelay(
      300,
      withSequence(withTiming(0.3, { duration: 250 }), withTiming(0, { duration: 450 })),
    );
    cutoutScale.value = withDelay(350, withTiming(1.08, { duration: 650, easing: EASE_OUT }));
    cutoutTranslateY.value = withDelay(350, withTiming(-24, { duration: 650, easing: EASE_OUT }));
    cutoutRotate.value = withDelay(350, withTiming(-0.7, { duration: 800, easing: EASE_IN_OUT }));
    edgeGlowOpacity.value = withDelay(420, withTiming(1, { duration: 400 }));
    shadowOpacity.value = withDelay(500, withTiming(0.22, { duration: 400, easing: EASE_OUT }));
    shadowScale.value = withDelay(500, withTiming(1, { duration: 400, easing: EASE_OUT }));
  }, [
    bgPhotoOpacity,
    brightBgOpacity,
    dustVeilOpacity,
    cutoutScale,
    cutoutTranslateY,
    cutoutRotate,
    edgeGlowOpacity,
    shadowOpacity,
    shadowScale,
  ]);

  useEffect(() => {
    if (status === 'success' && machineName) {
      labelOpacity.value = withDelay(900, withTiming(1, { duration: 400, easing: EASE_OUT }));
      labelTranslateY.value = withDelay(900, withTiming(0, { duration: 400, easing: EASE_OUT }));
      labelScale.value = withDelay(900, withTiming(1, { duration: 400, easing: EASE_OUT }));
      captionOpacity.value = withTiming(0, { duration: 300 });
    } else if (status === 'error') {
      bgPhotoOpacity.value = withTiming(1, { duration: 300 });
      brightBgOpacity.value = withTiming(0, { duration: 300 });
      dustVeilOpacity.value = withTiming(0, { duration: 200 });
      shadowOpacity.value = withTiming(0, { duration: 200 });
      edgeGlowOpacity.value = withTiming(0, { duration: 200 });
      cutoutScale.value = withTiming(1, { duration: 300 });
      cutoutTranslateY.value = withTiming(0, { duration: 300 });
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
      { scale: cutoutScale.value },
      { translateY: cutoutTranslateY.value },
      { rotate: `${cutoutRotate.value}deg` },
    ],
  }));
  const edgeGlowStyle = useAnimatedStyle(() => ({ opacity: edgeGlowOpacity.value }));
  const shadowStyle = useAnimatedStyle(() => ({
    opacity: shadowOpacity.value,
    transform: [{ scaleX: shadowScale.value }],
  }));
  const labelStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
    transform: [{ translateY: labelTranslateY.value }, { scale: labelScale.value }],
  }));
  const captionStyle = useAnimatedStyle(() => ({ opacity: captionOpacity.value }));

  const geometry = useMemo(() => computeGeometry(size), [size]);
  const fragments = useMemo(() => buildFragments(geometry), [geometry]);

  const hasCutout = !imageFailed && size !== null;

  return (
    <View onLayout={onLayout} style={styles.container}>
      {/* Layer 1 — original photo background */}
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

      {/* Layer 2 — dissolve / dust veil + fragments */}
      <Animated.View style={[styles.fullFill, styles.dustVeil, dustVeilStyle]} pointerEvents="none" />
      {hasCutout
        ? fragments.map((fragment) => (
            <Fragment key={fragment.id} config={fragment} />
          ))
        : null}

      {/* Bright neutral background (fades in) */}
      <Animated.View
        style={[styles.fullFill, { backgroundColor: BRIGHT_BG }, brightBgStyle]}
        pointerEvents="none"
      />

      {/* Layer 4 — soft elliptical shadow under the object */}
      {hasCutout ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.shadow,
            {
              left: geometry.shadowLeft,
              top: geometry.shadowTop,
              width: geometry.shadowWidth,
              height: geometry.shadowHeight,
            },
            shadowStyle,
          ]}
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
          {/* edge glow + subtle halo */}
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
        </Animated.View>
      ) : null}

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
      withTiming(1, { duration: 600, easing: EASE_OUT }),
    );
  }, [config.delay, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      opacity: interpolate(p, [0, 0.15, 1], [0, 0.85, 0]),
      transform: [
        { translateX: p * config.tx },
        { translateY: p * config.ty },
        { scale: interpolate(p, [0, 1], [1, 0.35]) },
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
  shadowLeft: number;
  shadowTop: number;
  shadowWidth: number;
  shadowHeight: number;
  centerX: number;
  centerY: number;
  rx: number;
  ry: number;
};

function computeGeometry(size: Size | null): Geometry {
  const containerWidth = size?.width ?? 0;
  const containerHeight = size?.height ?? 0;
  const focusWidth = containerWidth * 0.78;
  const focusHeight = containerHeight * 0.46;
  const focusLeft = (containerWidth - focusWidth) / 2;
  const focusTop = containerHeight * 0.19;
  const focusRadius = 34;
  const shadowWidth = focusWidth * 0.7;
  const shadowHeight = 26;
  const shadowLeft = focusLeft + (focusWidth - shadowWidth) / 2;
  const shadowTop = focusTop + focusHeight - 10;
  const centerX = containerWidth * 0.5;
  const centerY = containerHeight * 0.42;
  const rx = focusWidth * 0.5;
  const ry = focusHeight * 0.5;
  return {
    containerWidth,
    containerHeight,
    focusLeft,
    focusTop,
    focusWidth,
    focusHeight,
    focusRadius,
    shadowLeft,
    shadowTop,
    shadowWidth,
    shadowHeight,
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
    const dist = geo.containerWidth * (0.12 + (i % 5) * 0.02);
    const tx = Math.cos(angle) * dist;
    const ty = Math.sin(angle) * dist;
    const size = 2 + (i % 7);
    const rotate = ((i % 3) - 1) * 10;
    const delay = 320 + (i % 6) * 35;
    const color = FRAGMENT_COLORS[i % FRAGMENT_COLORS.length];
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
  shadow: {
    position: 'absolute',
    backgroundColor: '#1A1A1A',
    borderRadius: 999,
    opacity: 0,
  },
  clip: {
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  edgeGlow: {
    position: 'absolute',
    borderColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1.5,
    top: 0,
    left: 0,
  },
  fragment: {
    position: 'absolute',
    borderRadius: 1,
  },
  labelContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '70%',
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
    top: '70%',
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
