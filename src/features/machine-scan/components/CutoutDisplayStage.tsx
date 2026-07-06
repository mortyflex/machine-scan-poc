import { StyleSheet, View } from 'react-native';

import { SkiaCutoutStage } from './SkiaCutoutStage';
import { StickerMachineTitle } from './StickerMachineTitle';

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
  height = 460,
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
          <View style={styles.titleZone}>
            <StickerMachineTitle
              title={machineName}
              subtitle={machineSubtitle}
            />
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
    overflow: 'hidden',
  },
  titleZone: {
    position: 'absolute',
    bottom: 14,
    left: 16,
    right: 16,
    alignItems: 'center',
  },
});
