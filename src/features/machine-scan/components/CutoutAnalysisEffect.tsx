import {
  Canvas,
  Circle,
  Group,
  LinearGradient,
  Rect,
  useClock,
  vec,
} from '@shopify/react-native-skia';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

import { PhotoFallbackCard } from './PhotoFallbackCard';

export type CutoutAnalysisEffectProps = {
  imageUri: string;
};

type CardSize = { width: number; height: number };

const SHIMMER_BAND_WIDTH = 68;
const SHIMMER_PERIOD_MS = 2100;

// Deterministic sparkle field (fractions of the card size): no random on
// render, 20 small sparkles. White / cream / very pale yellow. Phase 6.6.6:
// smaller dots with individual twinkle speeds (~900–1600 ms per cycle) so
// the state reads as premium AI scanning, not floating confetti.
const SPARKLES = [
  { fx: 0.10, fy: 0.16, r: 1.8, phase: 0.05, speed: 5.2, color: '#FFFFFF' },
  { fx: 0.22, fy: 0.72, r: 1.4, phase: 0.62, speed: 6.4, color: '#FFF6D6' },
  { fx: 0.31, fy: 0.30, r: 1.2, phase: 0.31, speed: 4.4, color: '#FFFFFF' },
  { fx: 0.44, fy: 0.82, r: 1.6, phase: 0.85, speed: 5.8, color: '#FFFFFF' },
  { fx: 0.52, fy: 0.14, r: 1.5, phase: 0.47, speed: 6.9, color: '#FFF3C4' },
  { fx: 0.63, fy: 0.58, r: 1.2, phase: 0.12, speed: 4.9, color: '#FFFFFF' },
  { fx: 0.71, fy: 0.24, r: 1.9, phase: 0.73, speed: 4.1, color: '#FFF6D6' },
  { fx: 0.78, fy: 0.78, r: 1.3, phase: 0.28, speed: 6.1, color: '#FFFFFF' },
  { fx: 0.87, fy: 0.42, r: 1.6, phase: 0.55, speed: 5.5, color: '#FFFFFF' },
  { fx: 0.93, fy: 0.68, r: 1.3, phase: 0.91, speed: 6.6, color: '#FFF3C4' },
  { fx: 0.17, fy: 0.48, r: 1.2, phase: 0.40, speed: 4.6, color: '#FFFFFF' },
  { fx: 0.58, fy: 0.90, r: 1.4, phase: 0.20, speed: 5.9, color: '#FFFFFF' },
  { fx: 0.06, fy: 0.86, r: 1.3, phase: 0.68, speed: 6.2, color: '#FFF6D6' },
  { fx: 0.38, fy: 0.08, r: 1.5, phase: 0.15, speed: 4.3, color: '#FFFFFF' },
  { fx: 0.96, fy: 0.20, r: 1.2, phase: 0.80, speed: 6.8, color: '#FFFFFF' },
  { fx: 0.49, fy: 0.50, r: 1.1, phase: 0.36, speed: 5.1, color: '#FFF3C4' },
  { fx: 0.27, fy: 0.06, r: 1.3, phase: 0.52, speed: 6.0, color: '#FFFFFF' },
  { fx: 0.83, fy: 0.10, r: 1.2, phase: 0.09, speed: 4.7, color: '#FFF6D6' },
  { fx: 0.13, fy: 0.62, r: 1.4, phase: 0.77, speed: 5.4, color: '#FFFFFF' },
  { fx: 0.68, fy: 0.92, r: 1.2, phase: 0.44, speed: 6.5, color: '#FFF3C4' },
];

/**
 * Premium "analysis in progress" treatment for the captured photo: the
 * cover-style photo card plus a subtle diagonal shimmer and a few slow
 * sparkles. Purely decorative — it never pretends to be a cutout.
 */
export function CutoutAnalysisEffect({ imageUri }: CutoutAnalysisEffectProps) {
  const clock = useClock();
  const [size, setSize] = useState<CardSize>({ width: 0, height: 0 });

  return (
    <PhotoFallbackCard imageUri={imageUri} variant="loading">
      <View
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
        onLayout={(e) =>
          setSize({
            width: e.nativeEvent.layout.width,
            height: e.nativeEvent.layout.height,
          })
        }
      >
        {size.width > 0 && size.height > 0 ? (
          <Canvas style={StyleSheet.absoluteFill}>
            <ShimmerBand
              clock={clock}
              width={size.width}
              height={size.height}
            />
            {SPARKLES.map((sparkle, index) => (
              <AnalysisSparkle
                key={index}
                clock={clock}
                x={sparkle.fx * size.width}
                y={sparkle.fy * size.height}
                r={sparkle.r}
                phase={sparkle.phase}
                speed={sparkle.speed}
                color={sparkle.color}
              />
            ))}
          </Canvas>
        ) : null}
      </View>
    </PhotoFallbackCard>
  );
}

function ShimmerBand({
  clock,
  width,
  height,
}: {
  clock: SharedValue<number>;
  width: number;
  height: number;
}) {
  const transform = useDerivedValue(() => {
    const t = (clock.value % SHIMMER_PERIOD_MS) / SHIMMER_PERIOD_MS;
    const travel = width + SHIMMER_BAND_WIDTH * 3;
    return [{ translateX: -SHIMMER_BAND_WIDTH * 2 + t * travel }];
  });

  return (
    <Group transform={transform}>
      <Rect x={0} y={0} width={SHIMMER_BAND_WIDTH} height={height}>
        <LinearGradient
          start={vec(0, 0)}
          end={vec(SHIMMER_BAND_WIDTH, height)}
          colors={[
            'rgba(255,255,255,0)',
            'rgba(255,255,255,0.30)',
            'rgba(255,255,255,0)',
          ]}
        />
      </Rect>
    </Group>
  );
}

function AnalysisSparkle({
  clock,
  x,
  y,
  r,
  phase,
  speed,
  color,
}: {
  clock: SharedValue<number>;
  x: number;
  y: number;
  r: number;
  phase: number;
  speed: number;
  color: string;
}) {
  // Sharpened sine (pow) = short bright glints between dim rests — a real
  // twinkle, not a slow pulse. Each sparkle has its own speed and phase.
  const opacity = useDerivedValue(() => {
    const t = clock.value / 1000;
    const wave = 0.5 + 0.5 * Math.sin(t * speed + phase * Math.PI * 2);
    return 0.18 + 0.67 * Math.pow(wave, 2.4);
  });
  const cy = useDerivedValue(() => {
    const t = clock.value / 1000;
    return y + 1.5 * Math.sin(t * 0.8 + phase * Math.PI * 2);
  });

  return <Circle cx={x} cy={cy} r={r} color={color} opacity={opacity} />;
}
