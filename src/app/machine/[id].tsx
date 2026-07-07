import { Link, useRouter, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import {
  CutoutDisplayStage,
  MachineResultCard,
  PhotoFallbackCard,
  machineTypeLabels,
} from '@/features/machine-scan/components';
import {
  deleteMachineScan,
  getMachineScanById,
} from '@/features/machine-scan/storage';
import type { MachineScan } from '@/features/machine-scan/types';
import {
  AppText,
  BackButton,
  Card,
  PremiumDottedBackground,
  PrimaryButton,
  Screen,
} from '@/shared/components';
import { notifyError, notifySuccess } from '@/shared/haptics';
import { spacing, useAppTheme } from '@/shared/theme';

type DetailState =
  | { status: 'loading' }
  | { status: 'success'; scan: MachineScan }
  | { status: 'not_found' }
  | { status: 'error' };

type DeleteState = 'idle' | 'deleting' | 'error';

export default function MachineDetailScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = typeof params.id === 'string' ? params.id : undefined;

  const [state, setState] = useState<DetailState>({ status: 'loading' });
  const [deleteState, setDeleteState] = useState<DeleteState>('idle');

  useEffect(() => {
    if (!id) {
      setState({ status: 'not_found' });
      return;
    }
    let cancelled = false;
    setState({ status: 'loading' });
    getMachineScanById(id)
      .then((result) => {
        if (cancelled) return;
        if (result.ok) {
          setState({ status: 'success', scan: result.data });
        } else if (result.error.kind === 'not_found') {
          setState({ status: 'not_found' });
        } else {
          setState({ status: 'error' });
        }
      })
      .catch(() => {
        if (cancelled) return;
        setState({ status: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleDelete = useCallback(() => {
    if (!id) return;
    setDeleteState('deleting');
    deleteMachineScan(id)
      .then((result) => {
        if (result.ok) {
          notifySuccess();
          router.replace('/saved-machines');
        } else {
          notifyError();
          setDeleteState('error');
        }
      })
      .catch(() => {
        notifyError();
        setDeleteState('error');
      });
  }, [id, router]);

  if (state.status === 'loading') {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator color={theme.colors.primary} />
        <AppText variant="body" color="textSecondary" align="center">
          Chargement de la machine…
        </AppText>
      </Screen>
    );
  }

  if (state.status === 'not_found') {
    return (
      <Screen style={styles.center}>
        <Card style={styles.stateCard}>
          <AppText variant="title" color="danger">
            Machine introuvable
          </AppText>
          <AppText variant="body" color="textSecondary">
            Cette machine n’existe plus dans ta liste.
          </AppText>
          <Link href="/saved-machines" replace asChild>
            <PrimaryButton label="Retour à la liste" />
          </Link>
        </Card>
      </Screen>
    );
  }

  if (state.status === 'error') {
    return (
      <Screen style={styles.center}>
        <Card style={styles.stateCard}>
          <AppText variant="subtitle" color="danger">
            Chargement impossible
          </AppText>
          <AppText variant="body" color="textSecondary">
            Les détails de cette machine sont indisponibles pour le moment.
          </AppText>
          <Link href="/saved-machines" replace asChild>
            <PrimaryButton label="Retour à la liste" />
          </Link>
        </Card>
      </Screen>
    );
  }

  const { scan } = state;

  return (
    <Screen style={styles.detailsScreen}>
      <PremiumDottedBackground />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.backRow}>
          <BackButton
            onPress={() => router.replace('/saved-machines')}
          />
        </View>
        {scan.cutoutUri ? (
          <CutoutDisplayStage
            imageUri={scan.imageUri}
            cutoutUri={scan.cutoutUri}
            machineName={scan.machineName}
            machineSubtitle={machineTypeLabels[scan.machineType]}
          />
        ) : (
          <PhotoFallbackCard imageUri={scan.imageUri} variant="details" />
        )}

        <MachineResultCard
          hideName={Boolean(scan.cutoutUri)}
          result={{
            machineName: scan.machineName,
            machineType: scan.machineType,
            // Saved scans are always sport machines (non-machines are
            // blocked before save), including pre-7.3 records.
            isSportMachine: true,
            confidence: scan.confidence,
            description: scan.description,
            primaryMuscles: scan.primaryMuscles,
            secondaryMuscles: scan.secondaryMuscles,
            possibleExercises: scan.possibleExercises,
            alternativeNames: scan.alternativeNames,
            needsConfirmation: scan.needsConfirmation,
            uncertaintyReason: scan.uncertaintyReason,
          }}
        />

        {deleteState === 'error' ? (
          <AppText variant="caption" color="danger" align="center">
            Suppression impossible. Réessaie.
          </AppText>
        ) : null}
        <View style={styles.actions}>
          {/* Back navigation lives in the top BackButton only. */}
          <PrimaryButton
            label={
              deleteState === 'deleting' ? 'Suppression…' : 'Supprimer cette machine'
            }
            onPress={handleDelete}
            disabled={deleteState === 'deleting'}
            variant="danger"
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  stateCard: {
    gap: spacing.sm,
    alignItems: 'stretch',
    width: '100%',
  },
  // The screen itself is unpadded so the dotted background bleeds to the
  // device edges; the horizontal padding moves onto the scroll content.
  detailsScreen: {
    paddingHorizontal: 0,
  },
  scrollContent: {
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  backRow: {
    alignItems: 'flex-start',
  },
  actions: {
    gap: spacing.sm,
  },
});
