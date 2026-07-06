import {
  Circle,
  Group,
  Oval,
  SweepGradient,
  useClock,
  vec,
} from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

/**
 * Premium orbit beam (Phase 6.6.6): a thin elliptical light sweep that
 * slowly circles the cutout while the user decides on the validation
 * screen. Skia-only — one rotating group driven by the Skia clock, no JS
 * timers, no per-frame trig on the JS thread. It fades in only once the
 * dust reveal has settled and unmounts with the screen.
 */

const ORBIT_PERIOD_MS = 5600;
const TWO_PI = Math.PI * 2;

// The sweep gradient's bright head sits at this fraction of the circle;
// the orbit dot is pinned there inside the rotating group so it rides the
// beam without any extra animation work.
const HEAD_POSITION = 0.84;

export type CutoutOrbitBeamProps = {
  /** Center of the cutout zone. */
  cx: number;
  cy: number;
  /** Ellipse radii around the cutout zone. */
  rx: number;
  ry: number;
  /** Reveal progress 0→1; the beam appears near the end of the reveal. */
  progress: SharedValue<number>;
};

export function CutoutOrbitBeam({
  cx,
  cy,
  rx,
  ry,
  progress,
}: CutoutOrbitBeamProps) {
  const clock = useClock();

  const transform = useDerivedValue(() => [
    { rotate: ((clock.value % ORBIT_PERIOD_MS) / ORBIT_PERIOD_MS) * TWO_PI },
  ]);

  // Gate on the reveal (0 until ~80% progress) with a gentle breathing so
  // the beam feels alive without ever getting loud.
  const opacity = useDerivedValue(() => {
    const gate = Math.min(1, Math.max(0, (progress.value - 0.8) / 0.2));
    const breath =
      0.5 + 0.14 * Math.sin((clock.value / ORBIT_PERIOD_MS) * TWO_PI * 2);
    return gate * breath;
  });

  if (rx <= 0 || ry <= 0) {
    return null;
  }

  const headAngle = HEAD_POSITION * TWO_PI;
  const headX = cx + rx * Math.cos(headAngle);
  const headY = cy + ry * Math.sin(headAngle);

  return (
    <Group transform={transform} origin={vec(cx, cy)} opacity={opacity}>
      <Oval
        x={cx - rx}
        y={cy - ry}
        width={rx * 2}
        height={ry * 2}
        style="stroke"
        strokeWidth={3}
      >
        <SweepGradient
          c={vec(cx, cy)}
          colors={[
            'rgba(255,255,255,0)',
            'rgba(255,255,255,0)',
            'rgba(255,228,148,0)',
            'rgba(255,228,148,0.75)',
            'rgba(255,255,255,1)',
            'rgba(255,228,148,0.75)',
            'rgba(255,228,148,0)',
          ]}
          positions={[0, 0.5, 0.62, 0.76, HEAD_POSITION, 0.92, 1]}
        />
      </Oval>
      {/* Bright head riding the beam */}
      <Circle cx={headX} cy={headY} r={3.2} color="rgba(255,255,255,0.95)" />
      <Circle cx={headX} cy={headY} r={6} color="rgba(255,236,170,0.35)" />
    </Group>
  );
}
