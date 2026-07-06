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
 * Sticker machine title (Phase 6.6.10): the typo.png sticker look,
 * restored without the old pixelated text-copy outline. Two stacked
 * white plates at slightly different rotations form an organic die-cut
 * blob (native rounded corners — always smooth), the chunky deep-blue
 * Plus Jakarta Sans title sits on top with a soft white halo melting it
 * into the plate, and a diffuse shadow lifts the whole sticker.
 */
export function StickerMachineTitle({
  title,
  subtitle,
  maxLines = 2,
}: StickerMachineTitleProps) {
  return (
    <View style={styles.wrap} pointerEvents="none">
      {/* Offset backing plate: rotated the other way so its corners peek
          out around the main plate — the organic sticker silhouette. */}
      <View style={styles.backing} />
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
    maxWidth: '92%',
    transform: [{ rotate: '-1.2deg' }],
  },
  backing: {
    position: 'absolute',
    top: -5,
    bottom: -5,
    left: -12,
    right: -12,
    backgroundColor: '#FFFFFF',
    borderRadius: 34,
    transform: [{ rotate: '2.4deg' }],
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 5,
  },
  plate: {
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    paddingHorizontal: 22,
    paddingVertical: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 7,
  },
  title: {
    color: TITLE_COLOR,
    fontFamily: appFonts.headingStrong,
    fontSize: 28,
    lineHeight: 33,
    letterSpacing: -0.3,
    textAlign: 'center',
    textShadowColor: 'rgba(255,255,255,0.95)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  subtitle: {
    color: SUBTITLE_COLOR,
    fontFamily: appFonts.bodyMedium,
    fontSize: 15,
    textAlign: 'center',
  },
});
