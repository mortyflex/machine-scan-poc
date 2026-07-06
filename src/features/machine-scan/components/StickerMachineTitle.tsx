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
 * Sticker-style machine title (Phase 6.6.9): a large rounded white
 * sticker plate with a soft diffuse shadow and the chunky deep-blue
 * Plus Jakarta Sans title on top — the typo.png direction rendered
 * cleanly in RN. The previous offset-text outline produced a jagged,
 * pixelated edge, so it is gone: the plate gives the thick white
 * sticker contour with perfectly smooth rounded corners instead.
 */
export function StickerMachineTitle({
  title,
  subtitle,
  maxLines = 2,
}: StickerMachineTitleProps) {
  return (
    <View style={styles.wrap} pointerEvents="none">
      <View style={styles.plate}>
        <Text style={styles.title} numberOfLines={maxLines}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    maxWidth: '94%',
  },
  plate: {
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 30,
    paddingHorizontal: 24,
    paddingVertical: 13,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 7,
    transform: [{ rotate: '-1deg' }],
  },
  title: {
    color: TITLE_COLOR,
    fontFamily: appFonts.headingStrong,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  subtitle: {
    color: SUBTITLE_COLOR,
    fontFamily: appFonts.bodyMedium,
    fontSize: 15,
    textAlign: 'center',
  },
});
