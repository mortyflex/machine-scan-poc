import { StyleSheet, Text, View } from 'react-native';

import { appFonts } from '@/shared/theme/typography';

import { SkiaCutoutStage } from './SkiaCutoutStage';

export type CutoutDisplayStageProps = {
  imageUri: string;
  cutoutUri: string;
  /** Stage height in px; the cutout fills most of it. */
  height?: number;
  /** Machine name rendered as a sticker label inside the hero card. */
  machineName?: string;
  /** Optional smaller line under the name (e.g. machine type). */
  machineSubtitle?: string;
};

/**
 * Details hero card (Phase 6.6.7): the real cutout on the premium stage —
 * warm glow, dotted pattern, sticker border, ground shadow — framed as a
 * hero card with cream background, hairline border, deep soft shadow, and
 * the machine name pinned at the bottom as a sticker-style pill. Static
 * (no reveal, no beam). If the cutout fails to load, the stage falls back
 * to the honest photo card, never a fake cutout.
 */
export function CutoutDisplayStage({
  imageUri,
  cutoutUri,
  height = 420,
  machineName,
  machineSubtitle,
}: CutoutDisplayStageProps) {
  return (
    <View style={styles.shadowWrap}>
      <View style={[styles.card, { height }]}>
        <SkiaCutoutStage
          imageUri={imageUri}
          cutoutUri={cutoutUri}
          machineName=""
          variant="details"
        />
        {machineName ? (
          <View style={styles.stickerLabel}>
            <Text style={styles.stickerName} numberOfLines={2}>
              {machineName}
            </Text>
            {machineSubtitle ? (
              <Text style={styles.stickerSubtitle} numberOfLines={1}>
                {machineSubtitle}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Shadow lives on an unclipped wrapper so Android elevation and iOS
  // shadows survive the rounded overflow clip on the card itself.
  shadowWrap: {
    borderRadius: 36,
    backgroundColor: '#FAF8F1',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 30,
    elevation: 10,
  },
  card: {
    borderRadius: 36,
    borderWidth: 1,
    borderColor: 'rgba(230,220,190,0.45)',
    overflow: 'hidden',
  },
  stickerLabel: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    maxWidth: '88%',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.95)',
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 6,
    transform: [{ rotate: '-1.2deg' }],
  },
  stickerName: {
    color: '#111111',
    fontFamily: appFonts.headingStrong,
    fontSize: 25,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  stickerSubtitle: {
    color: '#666666',
    fontFamily: appFonts.body,
    fontSize: 15,
    textAlign: 'center',
  },
});
