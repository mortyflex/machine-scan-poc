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

const SHIMMER_BAND_WIDTH = 120;
const SHIMMER_PERIOD_MS = 1900;

// Deterministic sparkle field (fractions of the card size): no random on
// render, 16 sparkles, slow phases. White / pale yellow only. Sized and
// brightened in Phase 6.6.5 so the analysis state is clearly perceptible.
const SPARKLES = [
  { fx: 0.10, fy: 0.16, r: 2.6, phase: 0.05, color: '#FFFFFF' },
  { fx: 0.22, fy: 0.72, r: 2.0, phase: 0.62, color: '#FFF3C4' },
  { fx: 0.31, fy: 0.30, r: 1.8, phase: 0.31, color: '#FFFFFF' },
  { fx: 0.44, fy: 0.82, r: 2.4, phase: 0.85, color: '#FFFFFF' },
  { fx: 0.52, fy: 0.14, r: 2.2, phase: 0.47, color: '#FFF3C4' },
  { fx: 0.63, fy: 0.58, r: 1.7, phase: 0.12, color: '#FFFFFF' },
  { fx: 0.71, fy: 0.24, r: 2.8, phase: 0.73, color: '#FFF3C4' },
  { fx: 0.78, fy: 0.78, r: 1.9, phase: 0.28, color: '#FFFFFF' },
  { fx: 0.87, fy: 0.42, r: 2.3, phase: 0.55, color: '#FFFFFF' },
  { fx: 0.93, fy: 0.68, r: 1.8, phase: 0.91, color: '#FFF3C4' },
  { fx: 0.17, fy: 0.48, r: 1.6, phase: 0.40, color: '#FFFFFF' },
  { fx: 0.58, fy: 0.90, r: 2.0, phase: 0.20, color: '#FFFFFF' },
  { fx: 0.06, fy: 0.86, r: 1.8, phase: 0.68, color: '#FFF3C4' },
  { fx: 0.38, fy: 0.08, r: 2.1, phase: 0.15, color: '#FFFFFF' },
  { fx: 0.96, fy: 0.20, r: 1.7, phase: 0.80, color: '#FFFFFF' },
  { fx: 0.49, fy: 0.50, r: 1.5, phase: 0.36, color: '#FFF3C4' },
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
            'rgba(255,255,255,0.38)',
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
  color,
}: {
  clock: SharedValue<number>;
  x: number;
  y: number;
  r: number;
  phase: number;
  color: string;
}) {
  const opacity = useDerivedValue(() => {
    const t = clock.value / 1000;
    return 0.18 + 0.62 * (0.5 + 0.5 * Math.sin(t * 1.9 + phase * Math.PI * 2));
  });
  const cy = useDerivedValue(() => {
    const t = clock.value / 1000;
    return y + 2.5 * Math.sin(t * 0.8 + phase * Math.PI * 2);
  });

  return <Circle cx={x} cy={cy} r={r} color={color} opacity={opacity} />;
}
