import { Link, useRouter, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { MachineResultCard } from '@/features/machine-scan/components';
import {
  deleteMachineScan,
  getMachineScanById,
} from '@/features/machine-scan/storage';
import type { MachineScan } from '@/features/machine-scan/types';
import { AppText, Card, PrimaryButton, Screen } from '@/shared/components';
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
          router.replace('/saved-machines');
        } else {
          setDeleteState('error');
        }
      })
      .catch(() => setDeleteState('error'));
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
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {scan.cutoutUri ? (
          <View style={styles.cutoutStage}>
            <View style={styles.cutoutShadow}>
              <Image
                source={{ uri: scan.cutoutUri }}
                style={styles.cutoutImage}
                contentFit="contain"
              />
            </View>
          </View>
        ) : (
          <Card style={styles.imageCard}>
            <Image
              source={{ uri: scan.imageUri }}
              style={styles.image}
              contentFit="contain"
            />
          </Card>
        )}

        <MachineResultCard
          result={{
            machineName: scan.machineName,
            machineType: scan.machineType,
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
          <PrimaryButton
            label={
              deleteState === 'deleting' ? 'Suppression…' : 'Supprimer cette machine'
            }
            onPress={handleDelete}
            disabled={deleteState === 'deleting'}
            variant="ghost"
          />
          <Link href="/saved-machines" replace asChild>
            <PrimaryButton label="Retour à la liste" />
          </Link>
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
  scrollContent: {
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  imageCard: {
    padding: 0,
    overflow: 'hidden',
  },
  cutoutStage: {
    backgroundColor: '#F8F8F5',
    borderRadius: 20,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  cutoutShadow: {
    width: '78%',
    aspectRatio: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.18,
    shadowRadius: 22,
    elevation: 8,
  },
  cutoutImage: {
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: '#000',
  },
  actions: {
    gap: spacing.sm,
  },
});
