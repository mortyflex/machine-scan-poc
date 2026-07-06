import { Circle, Group, RoundedRect, rect, rrect } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

/**
 * One-shot dust reveal (Phase 6.6.5): when the real cutout arrives, the
 * photo card dissolves and a clearly visible burst of dust fragments is
 * carried away. Everything here is deterministic — the particle field is
 * generated once at module load with a seeded PRNG, never on render — and
 * the whole effect is driven by a single 0→1 progress shared value, so
 * nothing keeps animating once the reveal is done.
 */

export const REVEAL_DELAY_MS = 300;
export const REVEAL_DURATION_MS = 1500;

const PARTICLE_COUNT = 84;

// Dust palette: white, cream, pale yellow, light gray — all visible on the
// premium warm background.
const PARTICLE_COLORS = [
  '#FFFFFF',
  '#FFF4CD',
  '#FFE9A8',
  '#E6E4DC',
  '#FFFFFF',
];

type DustParticle = {
  /** Start position as fractions of the source rect. */
  fx: number;
  fy: number;
  /** Travel distance in px along the outward direction. */
  dist: number;
  /** Extra upward lift in px. */
  lift: number;
  /** Angle jitter (radians) added to the radial direction. */
  jitter: number;
  /** Radius (circles) / half-size (squares) in px: 2–6 px overall size. */
  r: number;
  /** Per-particle start delay as a fraction of the reveal (0–0.3). */
  delay: number;
  /** Peak opacity (0.75–1). */
  peak: number;
  /** Rotation amount in radians for square fragments. */
  spin: number;
  /** Square fragments rotate; round dust does not. */
  square: boolean;
  color: string;
};

// Small deterministic PRNG (mulberry32). Fixed seed: the dust field is
// identical on every mount and every render.
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PARTICLES: readonly DustParticle[] = (() => {
  const rand = mulberry32(0x5eed);
  const particles: DustParticle[] = [];
  for (let i = 0; i < PARTICLE_COUNT; i += 1) {
    particles.push({
      fx: rand(),
      fy: rand(),
      dist: 60 + rand() * 130, // 60–190 px
      lift: 40 + rand() * 100, // 40–140 px
      jitter: (rand() - 0.5) * 0.9,
      r: 0.85 + rand() * 1.15, // drawn ≈ 3–7 px overall
      delay: rand() * 0.26,
      peak: 0.85 + rand() * 0.15,
      spin: (rand() - 0.5) * 2.4,
      square: rand() < 0.35,
      color: PARTICLE_COLORS[Math.floor(rand() * PARTICLE_COLORS.length)],
    });
  }
  return particles;
})();

export type CutoutRevealDustProps = {
  /** Reveal progress 0→1 (one-shot). */
  progress: SharedValue<number>;
  /** Source rect the dust escapes from (the dissolving photo card). */
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * The dust layer of the reveal. Must be rendered inside a Skia Canvas,
 * above the dissolving photo so the fragments are never masked.
 */
export function CutoutRevealDust({
  progress,
  x,
  y,
  width,
  height,
}: CutoutRevealDustProps) {
  if (width <= 0 || height <= 0) {
    return null;
  }
  return (
    <Group>
      {PARTICLES.map((particle, index) => (
        <DustFragment
          key={index}
          particle={particle}
          progress={progress}
          rectX={x}
          rectY={y}
          rectW={width}
          rectH={height}
        />
      ))}
    </Group>
  );
}

function DustFragment({
  particle,
  progress,
  rectX,
  rectY,
  rectW,
  rectH,
}: {
  particle: DustParticle;
  progress: SharedValue<number>;
  rectX: number;
  rectY: number;
  rectW: number;
  rectH: number;
}) {
  const startX = rectX + particle.fx * rectW;
  const startY = rectY + particle.fy * rectH;

  // Radial escape direction: from the card center through the particle,
  // plus a per-particle jitter, so the cloud disperses outward.
  const baseAngle = Math.atan2(
    particle.fy - 0.5 || 0.001,
    particle.fx - 0.5 || 0.001,
  );
  const angle = baseAngle + particle.jitter;
  const dirX = Math.cos(angle) * particle.dist;
  const dirY = Math.sin(angle) * particle.dist;

  const local = useDerivedValue(() => {
    const p = progress.value;
    const q = Math.min(
      1,
      Math.max(0, (p - particle.delay) / (1 - particle.delay)),
    );
    return q;
  });

  const eased = useDerivedValue(() => {
    const q = local.value;
    return 1 - (1 - q) * (1 - q);
  });

  const opacity = useDerivedValue(() => {
    const q = local.value;
    // Fast ramp-in, long visible flight, then dissolve near the end.
    return Math.min(1, q * 3.5) * (1 - Math.pow(q, 2.4)) * particle.peak;
  });

  const transform = useDerivedValue(() => {
    const e = eased.value;
    return [
      { translateX: startX + dirX * e },
      { translateY: startY + dirY * e - particle.lift * local.value },
      { rotate: particle.square ? particle.spin * e : 0 },
    ];
  });

  const size = particle.r * 2.9;
  return (
    <Group transform={transform} opacity={opacity}>
      {particle.square ? (
        <RoundedRect
          rect={rrect(rect(-size / 2, -size / 2, size, size), 1.5, 1.5)}
          color={particle.color}
        />
      ) : (
        <Circle cx={0} cy={0} r={particle.r * 1.75} color={particle.color} />
      )}
    </Group>
  );
}
