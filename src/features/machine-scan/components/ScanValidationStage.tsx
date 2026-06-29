import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { Screen } from '@/shared/components';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScanValidationActions } from './ScanValidationActions';

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
const TITLE_COLOR = '#111111';
const SUBTITLE_COLOR = '#6B6B6B';

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
      <View style={styles.body}>
        <View style={styles.objectWrap}>
          <View style={styles.glowOuter} pointerEvents="none" />
          <View style={styles.glowInner} pointerEvents="none" />

          <Animated.View
            entering={ZoomIn.delay(80).duration(480)}
            style={styles.cardWrap}
          >
            {cutoutUri ? (
              <Image
                source={{ uri: cutoutUri }}
                style={styles.cutout}
                contentFit="contain"
              />
            ) : (
              <View style={styles.photoCard}>
                <Image
                  source={{ uri: imageUri }}
                  style={styles.photo}
                  contentFit="contain"
                />
              </View>
            )}
          </Animated.View>
        </View>

        <View style={styles.label}>
          <Text style={styles.machineName}>{machineName}</Text>
          {machineSubtitle ? (
            <Text style={styles.subtitle}>{machineSubtitle}</Text>
          ) : null}
          {needsConfirmation ? (
            <View style={styles.confirmPill}>
              <Text style={styles.confirmText}>À confirmer</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View
        style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}
      >
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
  body: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    paddingTop: 24,
  },
  objectWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowOuter: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 999,
    backgroundColor: '#FFE9A8',
    opacity: 0.45,
  },
  glowInner: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: '#FFF3CF',
    opacity: 0.55,
  },
  cardWrap: {
    width: '82%',
    maxWidth: 340,
    alignItems: 'center',
  },
  photoCard: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 8,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 8,
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  cutout: {
    width: 300,
    height: 220,
  },
  label: {
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 24,
  },
  machineName: {
    color: TITLE_COLOR,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.4,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  subtitle: {
    color: SUBTITLE_COLOR,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  confirmPill: {
    marginTop: 4,
    backgroundColor: '#FBEEDC',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  confirmText: {
    color: '#9A6B00',
    fontSize: 12,
    fontWeight: '700',
  },
  footer: {
    gap: 12,
    paddingHorizontal: 20,
  },
  hint: {
    color: '#9A9A96',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
});
