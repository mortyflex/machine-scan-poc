import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import type { MachineScan } from '@/features/machine-scan/types';
import { AppText, Card } from '@/shared/components';
import { radius, spacing } from '@/shared/theme';

export type SavedMachineCardProps = {
  machine: MachineScan;
};

export function SavedMachineCard({ machine }: SavedMachineCardProps) {
  const router = useRouter();
  const percent = Math.round(machine.confidence * 100);
  const hasCutout = Boolean(machine.cutoutUri);

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/machine/[id]', params: { id: machine.id } })}
      style={({ pressed }) => pressed && { opacity: 0.85 }}
    >
      <Card style={styles.card}>
        <View style={styles.body}>
          <Image
            source={{ uri: machine.cutoutUri ?? machine.imageUri }}
            style={[styles.thumb, hasCutout && styles.cutoutThumb]}
            contentFit={hasCutout ? 'contain' : 'cover'}
          />
          <View style={styles.info}>
            <AppText variant="subtitle" style={styles.name}>
              {machine.machineName}
            </AppText>
            <AppText variant="caption" color="textSecondary">
              {machine.primaryMuscles.join(' · ') || 'Muscles inconnus'}
            </AppText>
            <View style={styles.meta}>
              <View style={styles.confidencePill}>
                <AppText variant="caption" style={styles.confidenceText}>
                  Confiance {percent}%
                </AppText>
              </View>
              <AppText variant="caption" color="textMuted">
                {formatDate(machine.createdAt)}
              </AppText>
            </View>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });
  } catch {
    return iso;
  }
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.sm,
  },
  body: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    backgroundColor: '#000',
  },
  cutoutThumb: {
    backgroundColor: '#F8F8F5',
  },
  info: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    flexShrink: 1,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  // Cream fill so the pill stays visible on the white card (the theme
  // surface color is white since Phase 6.6.8).
  confidencePill: {
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: '#F5F2E9',
  },
  confidenceText: {
    color: '#4A463C',
  },
});
