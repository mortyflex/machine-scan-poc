import { StyleSheet, View } from 'react-native';

import { SkiaCutoutStage } from './SkiaCutoutStage';

export type CutoutDisplayStageProps = {
  imageUri: string;
  cutoutUri: string;
  /** Stage height in px; the cutout fills most of it. */
  height?: number;
};

/**
 * Shared details/saved-detail showcase (Phase 6.6.5): the real cutout on
 * the same premium stage as validation — warm glow, dotted pattern, sticker
 * border, ground shadow — but static (no reveal) and without the label.
 * If the cutout fails to load, the stage falls back to the honest photo
 * card, never a fake cutout.
 */
export function CutoutDisplayStage({
  imageUri,
  cutoutUri,
  height = 380,
}: CutoutDisplayStageProps) {
  return (
    <View style={[styles.stage, { height }]}>
      <SkiaCutoutStage
        imageUri={imageUri}
        cutoutUri={cutoutUri}
        machineName=""
        variant="details"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    borderRadius: 24,
    overflow: 'hidden',
  },
});
