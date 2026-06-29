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
  withTiming,
} from 'react-native-reanimated';

export type MachineRevealEffectLevel = 'photo-card' | 'real-cutout';

export type MachineRevealEffectProps = {
  imageUri: string;
  machineName?: string;
  status: 'loading' | 'success' | 'error';
  needsConfirmation?: boolean;
  /**
   * Reveal mode. Defaults to `'real-cutout'` when a `cutoutUri` is provided,
   * otherwise `'photo-card'`. Without a real cutout, the effect never fakes
   * an object extraction — it shows the full photo as a premium card.
   */
  effectLevel?: MachineRevealEffectLevel;
  /**
   * Future-ready.
   * When a backend segmentation exists, this will be a transparent PNG/WebP
   * of the detected object/machine. For now it is usually undefined.
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
const FRAGMENT_SIZES = [4, 6, 7, 9, 12];
const FRAGMENT_COLORS = [
  '#EDEDEA',
  '#D9D9D6',
  '#C9C9C4',
  'rgba(220,220,216,0.7)',
  'rgba(255,255,255,0.85)',
];

const BRIGHT_BG = '#FAFAFA';
const TITLE_COLOR = '#111111';
const SUBTITLE_COLOR = '#6B6B6B';

export function MachineRevealEffect({
  imageUri,
  machineName,
  status,
  needsConfirmation,
  effectLevel,
  cutoutUri,
}: MachineRevealEffectProps) {
  const [size, setSize] = useState<Size | null>(null);
  const [imageFailed, setImageFailed] = useState(false);

  const resolvedLevel: MachineRevealEffectLevel =
    effectLevel ?? (cutoutUri ? 'real-cutout' : 'photo-card');
  const useRealCutout = resolvedLevel === 'real-cutout' && Boolean(cutoutUri);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize((prev) =>
      prev && prev.width === width && prev.height === height
        ? prev
        : { width, height },
    );
  };

  const common = {
    imageUri,
    imageFailed,
    onImageError: () => setImageFailed(true),
    onLayout,
    status,
    machineName,
    needsConfirmation,
  };

  if (useRealCutout) {
    return <RealCutoutReveal {...common} cutoutUri={cutoutUri!} size={size} />;
  }
  return <PhotoCardReveal {...common} size={size} />;
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
/* Photo-card reveal (default, honest — no fake cutout)                        */
/* -------------------------------------------------------------------------- */

function PhotoCardReveal({
  imageUri,
  imageFailed,
  onImageError,
  onLayout,
  status,
  machineName,
  needsConfirmation,
  size,
}: CommonProps & { size: Size | null }) {
  const photoScale = useSharedValue(1);
  const photoTranslateY = useSharedValue(0);
  const shadowOpacity = useSharedValue(0);
  const labelOpacity = useSharedValue(0);
  const labelTranslateY = useSharedValue(8);
  const labelScale = useSharedValue(0.97);
  const captionOpacity = useSharedValue(1);

  useEffect(() => {
    // Photo settles (800 - 1300ms)
    photoScale.value = withDelay(800, withTiming(0.98, { duration: 500, easing: EASE_IN_OUT }));
    photoTranslateY.value = withDelay(800, withTiming(-6, { duration: 500, easing: EASE_OUT }));
    // Card shadow appears (800 - 1300ms)
    shadowOpacity.value = withDelay(800, withTiming(0.16, { duration: 500, easing: EASE_OUT }));
  }, [photoScale, photoTranslateY, shadowOpacity]);

  useEffect(() => {
    if (status === 'success' && machineName) {
      // Label (1300 - 1800ms)
      labelOpacity.value = withDelay(1300, withTiming(1, { duration: 450, easing: EASE_OUT }));
      labelTranslateY.value = withDelay(1300, withTiming(0, { duration: 450, easing: EASE_OUT }));
      labelScale.value = withDelay(1300, withTiming(1, { duration: 450, easing: EASE_OUT }));
      captionOpacity.value = withTiming(0, { duration: 300 });
    } else if (status === 'error') {
      labelOpacity.value = withTiming(1, { duration: 300 });
      labelTranslateY.value = withTiming(0, { duration: 300 });
      captionOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [status, machineName, labelOpacity, labelTranslateY, labelScale, captionOpacity]);

  const photoStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: photoScale.value },
      { translateY: photoTranslateY.value },
    ],
  }));
  const stageShadowStyle = useAnimatedStyle(() => ({
    shadowOpacity: shadowOpacity.value,
  }));
  const labelStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
    transform: [{ translateY: labelTranslateY.value }, { scale: labelScale.value }],
  }));
  const captionStyle = useAnimatedStyle(() => ({ opacity: captionOpacity.value }));

  const geometry = useMemo(() => computePhotoCardGeometry(size), [size]);
  const fragments = useMemo(() => buildFragments(geometry), [geometry]);

  return (
    <Animated.View
      onLayout={onLayout}
      style={[styles.stage, styles.stageShadow, stageShadowStyle]}
    >
      {/* Photo (full, no crop — contain) */}
      {!imageFailed ? (
        <Animated.View style={[styles.photoArea, photoStyle]}>
          <Image
            source={{ uri: imageUri }}
            style={styles.fullFill}
            contentFit="contain"
            onError={onImageError}
          />
        </Animated.View>
      ) : null}

      {/* Sober fragments around the photo */}
      {fragments.map((fragment) => (
        <Fragment key={fragment.id} config={fragment} />
      ))}

      {/* Recognition label (premium typography, no blobs) */}
      <Animated.View style={[styles.labelContainer, labelStyle]} pointerEvents="none">
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
      <Animated.View style={[styles.labelContainer, captionStyle]} pointerEvents="none">
        <ActivityIndicator color={SUBTITLE_COLOR} size="small" />
        <Text style={styles.captionText}>Analyse de la machine…</Text>
      </Animated.View>
    </Animated.View>
  );
}

/* -------------------------------------------------------------------------- */
/* Real cutout reveal (future — only when a real cutoutUri is provided)        */
/* -------------------------------------------------------------------------- */

function RealCutoutReveal({
  imageUri,
  cutoutUri,
  imageFailed,
  onImageError,
  onLayout,
  status,
  machineName,
  needsConfirmation,
  size,
}: CommonProps & { cutoutUri: string; size: Size | null }) {
  const cutoutScale = useSharedValue(1);
  const cutoutTranslateY = useSharedValue(0);
  const cutoutRotate = useSharedValue(0);
  const shadowOpacity = useSharedValue(0);
  const shadowScale = useSharedValue(0.75);
  const labelOpacity = useSharedValue(0);
  const labelTranslateY = useSharedValue(8);
  const labelScale = useSharedValue(0.97);
  const captionOpacity = useSharedValue(1);

  useEffect(() => {
    cutoutScale.value = withDelay(300, withTiming(1.13, { duration: 900, easing: EASE_OUT }));
    cutoutTranslateY.value = withDelay(300, withTiming(-42, { duration: 900, easing: EASE_OUT }));
    cutoutRotate.value = withDelay(300, withTiming(-1.2, { duration: 1000, easing: EASE_IN_OUT }));
    shadowOpacity.value = withDelay(700, withTiming(0.3, { duration: 500, easing: EASE_OUT }));
    shadowScale.value = withDelay(700, withTiming(1.05, { duration: 500, easing: EASE_OUT }));
  }, [cutoutScale, cutoutTranslateY, cutoutRotate, shadowOpacity, shadowScale]);

  useEffect(() => {
    if (status === 'success' && machineName) {
      labelOpacity.value = withDelay(1300, withTiming(1, { duration: 450, easing: EASE_OUT }));
      labelTranslateY.value = withDelay(1300, withTiming(0, { duration: 450, easing: EASE_OUT }));
      labelScale.value = withDelay(1300, withTiming(1, { duration: 450, easing: EASE_OUT }));
      captionOpacity.value = withTiming(0, { duration: 300 });
    } else if (status === 'error') {
      labelOpacity.value = withTiming(1, { duration: 300 });
      labelTranslateY.value = withTiming(0, { duration: 300 });
      captionOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [status, machineName, labelOpacity, labelTranslateY, labelScale, captionOpacity]);

  const cutoutStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: cutoutScale.value },
      { translateY: cutoutTranslateY.value },
      { rotate: `${cutoutRotate.value}deg` },
    ],
  }));
  const shadowStyle = useAnimatedStyle(() => ({
    opacity: shadowOpacity.value,
    transform: [{ scaleX: shadowScale.value }],
  }));
  const labelStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
    transform: [{ translateY: labelTranslateY.value }, { scale: labelScale.value }],
  }));
  const captionStyle = useAnimatedStyle(() => ({ opacity: captionOpacity.value }));

  const geometry = useMemo(() => computePhotoCardGeometry(size), [size]);
  const fragments = useMemo(() => buildFragments(geometry), [geometry]);

  return (
    <View onLayout={onLayout} style={styles.stage}>
      {/* Soft elliptical shadow under the floating object */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.objectShadow,
          {
            left: geometry.shadowLeft,
            top: geometry.shadowTop,
            width: geometry.shadowWidth,
            height: geometry.shadowHeight,
          },
          shadowStyle,
        ]}
      />

      {/* Real cutout object (transparent PNG/WebP) */}
      {!imageFailed ? (
        <Animated.View style={[styles.photoArea, cutoutStyle]}>
          <Image
            source={{ uri: cutoutUri }}
            style={styles.fullFill}
            contentFit="contain"
            onError={onImageError}
          />
        </Animated.View>
      ) : (
        <Image
          source={{ uri: imageUri }}
          style={[styles.fullFill, styles.photoArea]}
          contentFit="contain"
        />
      )}

      {fragments.map((fragment) => (
        <Fragment key={fragment.id} config={fragment} />
      ))}

      <Animated.View style={[styles.labelContainer, labelStyle]} pointerEvents="none">
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

      <Animated.View style={[styles.labelContainer, captionStyle]} pointerEvents="none">
        <ActivityIndicator color={SUBTITLE_COLOR} size="small" />
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
      withTiming(1, { duration: 700, easing: EASE_OUT }),
    );
  }, [config.delay, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      opacity: interpolate(p, [0, 0.15, 1], [0, 0.9, 0]),
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
  centerX: number;
  centerY: number;
  rx: number;
  ry: number;
  shadowLeft: number;
  shadowTop: number;
  shadowWidth: number;
  shadowHeight: number;
};

function computePhotoCardGeometry(size: Size | null): Geometry {
  const containerWidth = size?.width ?? 0;
  const containerHeight = size?.height ?? 0;
  const photoAreaHeight = containerHeight * 0.72;
  const centerX = containerWidth * 0.5;
  const centerY = photoAreaHeight * 0.5;
  const rx = containerWidth * 0.46;
  const ry = photoAreaHeight * 0.46;
  const shadowWidth = containerWidth * 0.66;
  const shadowHeight = 30;
  const shadowLeft = centerX - shadowWidth / 2;
  const shadowTop = photoAreaHeight - 16;
  return {
    containerWidth,
    containerHeight,
    centerX,
    centerY,
    rx,
    ry,
    shadowLeft,
    shadowTop,
    shadowWidth,
    shadowHeight,
  };
}

function buildFragments(geo: Geometry): FragmentConfig[] {
  if (geo.containerWidth === 0) return [];
  const fragments: FragmentConfig[] = [];
  for (let i = 0; i < FRAGMENT_COUNT; i++) {
    const angle = (i / FRAGMENT_COUNT) * Math.PI * 2 + 0.2;
    const startX = geo.centerX + Math.cos(angle) * geo.rx;
    const startY = geo.centerY + Math.sin(angle) * geo.ry;
    const dist = 22 + (i % 6) * 11;
    const tx = Math.cos(angle) * dist;
    const ty = Math.sin(angle) * dist;
    const size = FRAGMENT_SIZES[i % FRAGMENT_SIZES.length];
    const rotate = ((i % 7) - 3) * 11;
    const delay = 250 + (i % 6) * 30;
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
  stage: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: BRIGHT_BG,
    overflow: 'hidden',
    borderRadius: 24,
  },
  stageShadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 14 },
    shadowRadius: 18,
    elevation: 6,
  },
  photoArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: '26%',
  },
  fullFill: {
    ...StyleSheet.absoluteFillObject,
  },
  objectShadow: {
    position: 'absolute',
    backgroundColor: '#1A1A1A',
    borderRadius: 999,
  },
  fragment: {
    position: 'absolute',
    borderRadius: 1,
  },
  labelContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '74%',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  labelContent: {
    alignItems: 'center',
    gap: 4,
  },
  machineName: {
    color: TITLE_COLOR,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.4,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.12)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  subLabel: {
    color: SUBTITLE_COLOR,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  confirmPill: {
    marginTop: 6,
    backgroundColor: '#FBEEDC',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  confirmText: {
    color: '#9A6B00',
    fontSize: 12,
    fontWeight: '700',
  },
  errorTitle: {
    color: '#C0392B',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  captionText: {
    color: SUBTITLE_COLOR,
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
});
