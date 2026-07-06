import { StyleSheet, Text, View } from 'react-native';

import { appFonts } from '@/shared/theme/typography';

export type StickerMachineTitleProps = {
  title: string;
  subtitle?: string;
  maxLines?: number;
};

const TITLE_COLOR = '#203040';
const SUBTITLE_COLOR = '#5F6B78';

/**
 * Sticker machine title (Phase 6.6.10 fix): the typo.png look — a thick
 * white contour that hugs the letters themselves, drawn straight over
 * the hero background. NO plate, NO pill: the outline is built from
 * white text copies sampled on two dense rings (24 points), each
 * feathered with a soft white textShadow so the contour reads as one
 * smooth rounded edge instead of the old 12-offset jagged version.
 */

// Two rings of offsets computed on real circles: the outer ring sets the
// ~6 px contour thickness, the inner ring fills the gap to the glyphs.
const OUTLINE_OFFSETS: readonly [number, number][] = (() => {
  const offsets: [number, number][] = [];
  const rings = [
    { r: 6, samples: 16 },
    { r: 3.2, samples: 10 },
  ];
  for (const { r, samples } of rings) {
    for (let i = 0; i < samples; i += 1) {
      const angle = (i / samples) * Math.PI * 2;
      offsets.push([
        Number((Math.cos(angle) * r).toFixed(2)),
        Number((Math.sin(angle) * r).toFixed(2)),
      ]);
    }
  }
  return offsets;
})();

// A few extra copies pushed down with a blurred dark shadow give the
// sticker its soft drop shadow without a backing rectangle.
const SHADOW_OFFSETS: readonly [number, number][] = [
  [0, 7],
  [-4, 6],
  [4, 6],
];

export function StickerMachineTitle({
  title,
  subtitle,
  maxLines = 2,
}: StickerMachineTitleProps) {
  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.titleStack}>
        {SHADOW_OFFSETS.map(([dx, dy], index) => (
          <Text
            key={`s${index}`}
            style={[
              styles.title,
              styles.layer,
              styles.dropShadow,
              { transform: [{ translateX: dx }, { translateY: dy }] },
            ]}
            numberOfLines={maxLines}
            accessible={false}
            importantForAccessibility="no"
          >
            {title}
          </Text>
        ))}
        {OUTLINE_OFFSETS.map(([dx, dy], index) => (
          <Text
            key={index}
            style={[
              styles.title,
              styles.layer,
              styles.outline,
              { transform: [{ translateX: dx }, { translateY: dy }] },
            ]}
            numberOfLines={maxLines}
            accessible={false}
            importantForAccessibility="no"
          >
            {title}
          </Text>
        ))}
        <Text style={styles.title} numberOfLines={maxLines}>
          {title}
        </Text>
      </View>
      {subtitle ? (
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: '96%',
  },
  titleStack: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: TITLE_COLOR,
    fontFamily: appFonts.headingStrong,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  layer: {
    ...StyleSheet.absoluteFillObject,
  },
  outline: {
    color: '#FFFFFF',
    // Feathering: a soft white halo on every ring sample melts the 24
    // stamps into one smooth, rounded contour — no jagged steps.
    textShadowColor: 'rgba(255,255,255,0.9)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 2.5,
  },
  dropShadow: {
    color: 'transparent',
    textShadowColor: 'rgba(30,40,60,0.16)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 9,
  },
  subtitle: {
    color: SUBTITLE_COLOR,
    fontFamily: appFonts.bodyMedium,
    fontSize: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(255,255,255,0.9)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
});
