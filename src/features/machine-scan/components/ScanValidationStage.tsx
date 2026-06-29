import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/shared/components';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScanValidationActions } from './ScanValidationActions';
import { SkiaCutoutStage } from './SkiaCutoutStage';

export type ScanValidationStageProps = {
  imageUri: string;
  cutoutUri?: string;
  machineName: string;
  machineSubtitle?: string;
  needsConfirmation?: boolean;
  onConfirm: () => void;
  onRetake: () => void;
  onReject?: () => void;
};

const STAGE_BG = '#F8F8F5';

export function ScanValidationStage({
  imageUri,
  cutoutUri,
  machineName,
  machineSubtitle,
  needsConfirmation,
  onConfirm,
  onRetake,
  onReject,
}: ScanValidationStageProps) {
  const insets = useSafeAreaInsets();

  return (
    <Screen style={[styles.stage, { backgroundColor: STAGE_BG }]}>
      <SkiaCutoutStage
        imageUri={imageUri}
        cutoutUri={cutoutUri}
        machineName={machineName}
        machineSubtitle={machineSubtitle}
        needsConfirmation={needsConfirmation}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <ScanValidationActions
          onConfirm={onConfirm}
          onRetake={onRetake}
          onReject={onReject}
        />
        <Text style={styles.hint}>
          Pas ce que vous attendiez ? Reprendre la photo
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stage: {
    justifyContent: 'space-between',
  },
  footer: {
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  hint: {
    color: '#9A9A96',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
});
