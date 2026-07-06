import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Canvas, Circle, Fill, Group } from '@shopify/react-native-skia';

export type PremiumDottedBackgroundProps = {
  /** Page base color behind the dots. */
  color?: string;
  dotColor?: string;
  spacing?: number;
  dotRadius?: number;
};

/**
 * Full-bleed premium page background (Phase 6.6.8): warm base + very
 * subtle dotted grid, shared by the details screens so the content cards
 * float on the same stage as the hero. Static Skia canvas, absolutely
 * positioned behind the content, no animation.
 */
export function PremiumDottedBackground({
  color = '#FAFAF7',
  dotColor = 'rgba(60,55,40,0.07)',
  spacing = 28,
  dotRadius = 1.2,
}: PremiumDottedBackgroundProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  const dots = useMemo(() => {
    const points: { x: number; y: number }[] = [];
    for (let y = spacing / 2; y < size.height; y += spacing) {
      for (let x = spacing / 2; x < size.width; x += spacing) {
        points.push({ x, y });
      }
    }
    return points;
  }, [size.width, size.height, spacing]);

  return (
    <View
      style={StyleSheet.absoluteFillObject}
      pointerEvents="none"
      onLayout={(e) =>
        setSize({
          width: e.nativeEvent.layout.width,
          height: e.nativeEvent.layout.height,
        })
      }
    >
      {size.width > 0 && size.height > 0 ? (
        <Canvas style={StyleSheet.absoluteFillObject}>
          <Fill color={color} />
          <Group>
            {dots.map((d, i) => (
              <Circle key={i} cx={d.x} cy={d.y} r={dotRadius} color={dotColor} />
            ))}
          </Group>
        </Canvas>
      ) : null}
    </View>
  );
}
