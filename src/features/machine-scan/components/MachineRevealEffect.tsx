import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, type DimensionValue, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { AppText } from '@/shared/components';
import { radius, spacing, useAppTheme } from '@/shared/theme';

export type MachineRevealEffectProps = {
  imageUri: string;
  machineName?: string;
  status: 'loading' | 'success' | 'error';
  needsConfirmation?: boolean;
};

type ParticleConfig = {
  left: DimensionValue;
  top: DimensionValue;
  delay: number;
};

const PARTICLES: ParticleConfig[] = [
  { left: '82%', top: '50%', delay: 0 },
  { left: '66%', top: '78%', delay: 90 },
  { left: '34%', top: '78%', delay: 180 },
  { left: '18%', top: '50%', delay: 270 },
  { left: '34%', top: '22%', delay: 360 },
  { left: '66%', top: '22%', delay: 450 },
];

const EASE_OUT = Easing.out(Easing.quad);

export function MachineRevealEffect({
  imageUri,
  machineName,
  status,
  needsConfirmation,
}: MachineRevealEffectProps) {
  const theme = useAppTheme();
  const [imageFailed, setImageFailed] = useState(false);

  const dimOpacity = useSharedValue(0);
  const photoScale = useSharedValue(1);
  const focusScale = useSharedValue(0.6);
  const focusOpacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const particlesOpacity = useSharedValue(0);
  const labelOpacity = useSharedValue(0);
  const labelTranslateY = useSharedValue(16);
  const captionOpacity = useSharedValue(1);

  useEffect(() => {
    dimOpacity.value = withDelay(100, withTiming(0.5, { duration: 500 }));
    photoScale.value = withTiming(1.05, { duration: 1400, easing: EASE_OUT });
    focusScale.value = withDelay(250, withTiming(1, { duration: 500, easing: EASE_OUT }));
    focusOpacity.value = withDelay(250, withTiming(1, { duration: 300 }));
    glowOpacity.value = withDelay(250, withTiming(0.6, { duration: 600 }));
    particlesOpacity.value = withDelay(450, withTiming(1, { duration: 400 }));
  }, [dimOpacity, photoScale, focusScale, focusOpacity, glowOpacity, particlesOpacity]);

  useEffect(() => {
    if (status === 'success' && machineName) {
      labelOpacity.value = withDelay(80, withTiming(1, { duration: 400 }));
      labelTranslateY.value = withDelay(80, withTiming(0, { duration: 400, easing: EASE_OUT }));
      captionOpacity.value = withTiming(0, { duration: 300 });
    } else if (status === 'error') {
      captionOpacity.value = withTiming(0, { duration: 300 });
      focusOpacity.value = withTiming(0, { duration: 300 });
      glowOpacity.value = withTiming(0, { duration: 300 });
      particlesOpacity.value = withTiming(0, { duration: 300 });
      dimOpacity.value = withTiming(0.25, { duration: 400 });
    }
  }, [status, machineName, labelOpacity, labelTranslateY, captionOpacity, focusOpacity, glowOpacity, particlesOpacity, dimOpacity]);

  const photoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: photoScale.value }],
  }));

  const dimStyle = useAnimatedStyle(() => ({
    opacity: dimOpacity.value,
  }));

  const focusStyle = useAnimatedStyle(() => ({
    opacity: focusOpacity.value,
    transform: [{ scale: focusScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const particlesStyle = useAnimatedStyle(() => ({
    opacity: particlesOpacity.value,
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
    transform: [{ translateY: labelTranslateY.value }],
  }));

  const captionStyle = useAnimatedStyle(() => ({
    opacity: captionOpacity.value,
  }));

  return (
    <Animated.View style={styles.container}>
      {!imageFailed ? (
        <Animated.View style={[styles.fullFill, photoStyle]}>
          <Image
            source={{ uri: imageUri }}
            style={styles.fullFill}
            contentFit="cover"
            onError={() => setImageFailed(true)}
          />
        </Animated.View>
      ) : null}

      <Animated.View style={[styles.fullFill, styles.dim, dimStyle]} />

      <Animated.View
        style={[styles.halo, glowStyle, { backgroundColor: theme.colors.primary }]}
        pointerEvents="none"
      />

      <Animated.View
        pointerEvents="none"
        style={[styles.focusRing, focusStyle, { borderColor: theme.colors.primary }]}
      />

      <Animated.View style={[styles.fullFill, particlesStyle]} pointerEvents="none">
        {PARTICLES.map((particle, index) => (
          <Particle
            key={index}
            left={particle.left}
            top={particle.top}
            delay={particle.delay}
            color={theme.colors.primary}
          />
        ))}
      </Animated.View>

      <Animated.View
        style={[styles.labelContainer, labelStyle]}
        pointerEvents="none"
      >
        {status === 'success' && machineName ? (
          <>
            <AppText variant="title" align="center" color="primaryText" style={styles.labelText}>
              {machineName}
            </AppText>
            {needsConfirmation ? (
              <AppText variant="caption" align="center" color="primaryText">
                À confirmer
              </AppText>
            ) : null}
          </>
        ) : null}
      </Animated.View>

      <Animated.View style={[styles.caption, captionStyle]} pointerEvents="none">
        <ActivityIndicator color={theme.colors.primaryText} />
        <AppText variant="caption" align="center" color="primaryText">
          Analyse de la machine…
        </AppText>
      </Animated.View>
    </Animated.View>
  );
}

type ParticleProps = {
  left: DimensionValue;
  top: DimensionValue;
  delay: number;
  color: string;
};

function Particle({ left, top, delay, color }: ParticleProps) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(0.9, { duration: 300 }));
    scale.value = withDelay(
      delay,
      withSequence(
        withTiming(1, { duration: 300, easing: EASE_OUT }),
        withRepeat(withTiming(0.7, { duration: 900 }), -1, true),
      ),
    );
  }, [delay, opacity, scale]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const positionStyle: ViewStyle = { left, top, backgroundColor: color };

  return (
    <Animated.View
      style={[
        styles.particle,
        positionStyle,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: '#050608',
    overflow: 'hidden',
    borderRadius: radius.lg,
  },
  fullFill: {
    ...StyleSheet.absoluteFillObject,
  },
  dim: {
    backgroundColor: '#050608',
  },
  halo: {
    position: 'absolute',
    width: '64%',
    aspectRatio: 1,
    alignSelf: 'center',
    top: '28%',
    borderRadius: 999,
    opacity: 0.2,
    transform: [{ scale: 1 }],
  },
  focusRing: {
    position: 'absolute',
    width: '58%',
    aspectRatio: 1,
    alignSelf: 'center',
    top: '31%',
    borderRadius: 999,
    borderWidth: 2,
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    marginLeft: -4,
    marginTop: -4,
    borderRadius: 4,
  },
  labelContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  labelText: {
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  caption: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
