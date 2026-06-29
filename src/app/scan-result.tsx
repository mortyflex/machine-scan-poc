import { Link, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { recognizeMachine } from '@/features/machine-scan/api';
import type { RecognitionErrorKind } from '@/features/machine-scan/api';
import {
  MachineRevealEffect,
  MachineResultCard,
} from '@/features/machine-scan/components';
import {
  saveMachineScan,
  toMachineScanInput,
} from '@/features/machine-scan/storage';
import type { MachineRecognitionResult } from '@/features/machine-scan/types';
import { AppText, Card, PrimaryButton, Screen } from '@/shared/components';
import { spacing } from '@/shared/theme';

type ScanState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: MachineRecognitionResult }
  | { status: 'error'; kind: RecognitionErrorKind };

type SaveState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'saved'; id: string }
  | { status: 'error' };

const ERROR_MESSAGES: Record<RecognitionErrorKind, string> = {
  missing_image:
    "Aucune image à analyser. Reprends une photo pour lancer la reconnaissance.",
  invalid_response:
    "La reconnaissance n'a pas pu être interprétée. Réessaie ou reprends une photo.",
  provider_error:
    "Le service de reconnaissance est indisponible. Réessaie dans un instant.",
};

export default function ScanResultScreen() {
  const params = useLocalSearchParams<{ imageUri?: string | string[] }>();
  const imageUri =
    typeof params.imageUri === 'string' ? params.imageUri : undefined;

  const [scanState, setScanState] = useState<ScanState>({ status: 'idle' });
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!imageUri) {
      return;
    }
    let cancelled = false;
    setScanState({ status: 'loading' });
    recognizeMachine(imageUri)
      .then((result) => {
        if (cancelled) return;
        if (result.ok) {
          setScanState({ status: 'success', data: result.data });
        } else {
          setScanState({ status: 'error', kind: result.error.kind });
        }
      })
      .catch(() => {
        if (cancelled) return;
        setScanState({ status: 'error', kind: 'provider_error' });
      });
    return () => {
      cancelled = true;
    };
  }, [imageUri, retryCount]);

  const handleRetry = () => setRetryCount((count) => count + 1);

  const revealStatus: 'loading' | 'success' | 'error' =
    scanState.status === 'success'
      ? 'success'
      : scanState.status === 'error'
        ? 'error'
        : 'loading';

  if (!imageUri) {
    return <MissingImageScreen />;
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <AppText variant="title">Résultat du scan</AppText>

        <MachineRevealEffect
          imageUri={imageUri}
          status={revealStatus}
          machineName={
            scanState.status === 'success'
              ? scanState.data.machineName
              : undefined
          }
          needsConfirmation={
            scanState.status === 'success'
              ? scanState.data.needsConfirmation
              : undefined
          }
        />

        {scanState.status === 'error' ? (
          <ErrorBlock kind={scanState.kind} onRetry={handleRetry} />
        ) : null}
        {scanState.status === 'success' ? (
          <Animated.View
            entering={FadeInUp.delay(100).duration(450)}
            style={styles.successBlock}
          >
            <MachineResultCard result={scanState.data} />
            <SaveBlock data={scanState.data} imageUri={imageUri} />
          </Animated.View>
        ) : null}

        <View style={styles.actions}>
          <Link href="/camera" replace asChild>
            <PrimaryButton
              label="Reprendre une photo"
              variant={scanState.status === 'success' ? 'primary' : 'ghost'}
            />
          </Link>
          <Link href="/" replace asChild>
            <PrimaryButton label="Accueil" variant="ghost" />
          </Link>
        </View>
      </ScrollView>
    </Screen>
  );
}

function ErrorBlock({
  kind,
  onRetry,
}: {
  kind: RecognitionErrorKind;
  onRetry: () => void;
}) {
  return (
    <Card style={styles.stateCard}>
      <AppText variant="subtitle" color="danger">
        Reconnaissance impossible
      </AppText>
      <AppText variant="body" color="textSecondary">
        {ERROR_MESSAGES[kind]}
      </AppText>
      <PrimaryButton label="Réessayer" onPress={onRetry} />
    </Card>
  );
}

function MissingImageScreen() {
  return (
    <Screen style={styles.missingScreen}>
      <Card style={styles.missingCard}>
        <AppText variant="title" color="danger">
          Image manquante
        </AppText>
        <AppText variant="body" color="textSecondary">
          Aucune photo capturée n&apos;a été transmise. Ouvre la caméra pour
          scanner une machine.
        </AppText>
        <Link href="/camera" replace asChild>
          <PrimaryButton label="Ouvrir la caméra" />
        </Link>
        <Link href="/" replace asChild>
          <PrimaryButton label="Accueil" variant="ghost" />
        </Link>
      </Card>
    </Screen>
  );
}

function SaveBlock({
  data,
  imageUri,
}: {
  data: MachineRecognitionResult;
  imageUri: string;
}) {
  const [state, setState] = useState<SaveState>({ status: 'idle' });

  const handleSave = () => {
    setState({ status: 'saving' });
    saveMachineScan(toMachineScanInput(data, imageUri))
      .then((result) => {
        if (result.ok) {
          setState({ status: 'saved', id: result.data.id });
        } else {
          setState({ status: 'error' });
        }
      })
      .catch(() => setState({ status: 'error' }));
  };

  if (state.status === 'saved') {
    return (
      <Card style={styles.saveSuccessCard}>
        <AppText variant="subtitle" color="success">
          Machine sauvegardée
        </AppText>
        <Link href="/saved-machines" replace asChild>
          <PrimaryButton label="Voir mes machines" />
        </Link>
      </Card>
    );
  }

  return (
    <View style={styles.saveArea}>
      {state.status === 'error' ? (
        <AppText variant="caption" color="danger" align="center">
          Sauvegarde impossible. Réessaie.
        </AppText>
      ) : null}
      <PrimaryButton
        label={
          state.status === 'saving'
            ? 'Sauvegarde…'
            : 'Sauvegarder cette machine'
        }
        onPress={handleSave}
        disabled={state.status === 'saving'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  stateCard: {
    gap: spacing.sm,
    alignItems: 'center',
  },
  successBlock: {
    gap: spacing.md,
  },
  saveArea: {
    gap: spacing.xs,
  },
  saveSuccessCard: {
    gap: spacing.sm,
    alignItems: 'stretch',
  },
  actions: {
    gap: spacing.sm,
  },
  missingScreen: {
    justifyContent: 'center',
  },
  missingCard: {
    gap: spacing.sm,
    alignItems: 'stretch',
  },
});
