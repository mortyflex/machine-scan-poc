import { StyleSheet, Text, View } from 'react-native';

import { appFonts } from '@/shared/theme/typography';

export type StickerMachineTitleProps = {
  title: string;
  subtitle?: string;
  maxLines?: number;
};

const TITLE_COLOR = '#223247';
const SUBTITLE_COLOR = '#5F6B78';

// Text-hugging sticker outline (typo.png reference): the title is drawn in
// thick white at offsets around the silhouette of the letters, then the
// navy text on top — same trick as the Skia sticker border, but with RN
// Text layers. 12 copies ≈ a 4–5 px die-cut edge that follows the glyphs
// instead of a rectangular pill.
const OUTLINE_OFFSETS: readonly [number, number][] = [
  [-4, 0],
  [4, 0],
  [0, -4],
  [0, 4],
  [-3, -3],
  [3, -3],
  [-3, 3],
  [3, 3],
  [-2, -1],
  [2, 1],
  [-1, 2],
  [1, -2],
];

// The four cardinal copies also carry a soft text shadow so the sticker
// floats on the page without a plaque rectangle behind it.
const SHADOW_COPIES = 4;

/**
 * Sticker-style machine title (Phase 6.6.8): chunky rounded ExtraBold
 * text in deep blue with a thick white outline hugging the letters and a
 * soft diffuse shadow — inspired by the typo.png reference. Handles long
 * names on two lines.
 */
export function StickerMachineTitle({
  title,
  subtitle,
  maxLines = 2,
}: StickerMachineTitleProps) {
  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.titleStack}>
        {OUTLINE_OFFSETS.map(([dx, dy], index) => (
          <Text
            key={index}
            style={[
              styles.title,
              styles.outline,
              index < SHADOW_COPIES && styles.outlineShadow,
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
    paddingVertical: 6,
  },
  titleStack: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: TITLE_COLOR,
    fontFamily: appFonts.headingStrong,
    fontSize: 27,
    lineHeight: 33,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  outline: {
    ...StyleSheet.absoluteFillObject,
    color: '#FFFFFF',
  },
  outlineShadow: {
    textShadowColor: 'rgba(30,40,60,0.22)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 7,
  },
  subtitle: {
    color: SUBTITLE_COLOR,
    fontFamily: appFonts.bodyMedium,
    fontSize: 15,
    textAlign: 'center',
    textShadowColor: 'rgba(255,255,255,0.9)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
});
