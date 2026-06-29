import { Link, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { recognizeMachine } from '@/features/machine-scan/api';
import type { RecognitionErrorKind } from '@/features/machine-scan/api';
import { MachineResultCard } from '@/features/machine-scan/components';
import type { MachineRecognitionResult } from '@/features/machine-scan/types';
import { AppText, Card, PrimaryButton, Screen } from '@/shared/components';
import { spacing, useAppTheme } from '@/shared/theme';

type ScanState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: MachineRecognitionResult }
  | { status: 'error'; kind: RecognitionErrorKind };

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

        <Card style={styles.imageCard}>
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            contentFit="contain"
          />
        </Card>

        {scanState.status === 'loading' ? <LoadingBlock /> : null}
        {scanState.status === 'error' ? (
          <ErrorBlock kind={scanState.kind} onRetry={handleRetry} />
        ) : null}
        {scanState.status === 'success' ? (
          <View style={styles.successBlock}>
            <MachineResultCard result={scanState.data} />
            <View style={styles.saveArea}>
              <PrimaryButton label="Sauvegarder cette machine" disabled />
              <AppText variant="caption" color="textMuted" align="center">
                Disponible en Phase 5
              </AppText>
            </View>
          </View>
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

function LoadingBlock() {
  const theme = useAppTheme();
  return (
    <Card style={styles.stateCard}>
      <ActivityIndicator color={theme.colors.primary} />
      <AppText variant="body" color="textSecondary" align="center">
        Analyse de la machine…
      </AppText>
    </Card>
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

const styles = StyleSheet.create({
  scrollContent: {
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  imageCard: {
    padding: 0,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: '#000',
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
