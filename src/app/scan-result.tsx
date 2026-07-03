import { Link, useRouter, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { recognizeMachine } from '@/features/machine-scan/api';
import type { RecognitionErrorKind } from '@/features/machine-scan/api';
import {
  generateMachineCutout,
  getCutoutConfig,
} from '@/features/machine-scan/cutout';
import type { CutoutErrorKind } from '@/features/machine-scan/cutout';
import {
  CutoutDebugPanel,
  MachineResultCard,
  ScanValidationStage,
} from '@/features/machine-scan/components';
import type { CutoutDebugStatus } from '@/features/machine-scan/components';
import {
  saveMachineScan,
  toMachineScanInput,
} from '@/features/machine-scan/storage';
import type {
  MachineRecognitionResult,
  MachineType,
} from '@/features/machine-scan/types';
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

type CutoutState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; cutoutUri: string }
  | { status: 'failed'; errorKind: CutoutErrorKind };

const ERROR_MESSAGES: Record<RecognitionErrorKind, string> = {
  missing_image:
    "Aucune image à analyser. Reprends une photo pour lancer la reconnaissance.",
  invalid_response:
    "La reconnaissance n'a pas pu être interprétée. Réessaie ou reprends une photo.",
  provider_error:
    "Le service de reconnaissance est indisponible. Réessaie dans un instant.",
};

const MACHINE_TYPE_LABELS: Record<MachineType, string> = {
  lower_body_machine: 'Bas du corps',
  upper_body_machine: 'Haut du corps',
  cable_machine: 'Machine à poulie',
  free_weight_station: 'Poste poids libres',
  cardio_machine: 'Cardio',
  unknown: 'Type inconnu',
};

export default function ScanResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ imageUri?: string | string[] }>();
  const imageUri =
    typeof params.imageUri === 'string' ? params.imageUri : undefined;

  const [scanState, setScanState] = useState<ScanState>({ status: 'idle' });
  const [cutoutState, setCutoutState] = useState<CutoutState>({
    status: 'idle',
  });
  const [isValidated, setIsValidated] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [cutoutAttempt, setCutoutAttempt] = useState(0);
  const cutoutConfig = getCutoutConfig();

  useEffect(() => {
    if (!imageUri) {
      return;
    }
    let cancelled = false;
    setScanState({ status: 'loading' });
    setCutoutState({ status: 'idle' });
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

  // Real cutout generation, kicked off after recognition success. Failures
  // are non-blocking: the validation stage falls back to the honest photo.
  useEffect(() => {
    if (scanState.status !== 'success' || !imageUri) {
      return;
    }
    let cancelled = false;
    setCutoutState({ status: 'loading' });
    generateMachineCutout(imageUri)
      .then((result) => {
        if (cancelled) return;
        if (result.ok) {
          setCutoutState({ status: 'ready', cutoutUri: result.data.cutoutUri });
        } else {
          setCutoutState({ status: 'failed', errorKind: result.error.kind });
        }
      })
      .catch(() => {
        if (cancelled) return;
        setCutoutState({ status: 'failed', errorKind: 'cutout_failed' });
      });
    return () => {
      cancelled = true;
    };
  }, [scanState.status, imageUri, retryCount, cutoutAttempt]);

  const handleRetry = () => {
    setIsValidated(false);
    setRetryCount((count) => count + 1);
  };

  if (!imageUri) {
    return <MissingImageScreen />;
  }

  if (scanState.status === 'error') {
    return (
      <ErrorScreen
        kind={scanState.kind}
        onRetry={handleRetry}
        onRetake={() => router.replace('/camera')}
      />
    );
  }

  if (
    scanState.status === 'idle' ||
    scanState.status === 'loading'
  ) {
    return <LoadingStage imageUri={imageUri} label="Analyse de la machine…" />;
  }

  const cutoutUri =
    cutoutState.status === 'ready' ? cutoutState.cutoutUri : undefined;

  // Dev-only diagnostic overlay (Phase 6.6.1): confirms on-device whether
  // the env vars are read and whether the backend request actually fires.
  const debugPanel = __DEV__ ? (
    <CutoutDebugPanel
      provider={cutoutConfig.provider}
      apiBaseUrl={cutoutConfig.apiBaseUrl}
      status={toCutoutDebugStatus(cutoutState)}
      errorKind={
        cutoutState.status === 'failed' ? cutoutState.errorKind : undefined
      }
      visualMode={cutoutUri ? 'real-cutout' : 'photo-fallback-cover'}
      onRetry={() => setCutoutAttempt((attempt) => attempt + 1)}
      bottomOffset={isValidated ? 8 : 170}
    />
  ) : null;

  // Success — brief cutout generation step (only while the remote provider
  // is actually working; the disabled provider resolves instantly).
  if (cutoutState.status === 'idle' || cutoutState.status === 'loading') {
    return (
      <View style={styles.flex}>
        <LoadingStage imageUri={imageUri} label="Détourage de l'objet…" />
        {debugPanel}
      </View>
    );
  }

  // Success — validation step (CapWords-like) before details.
  if (!isValidated) {
    return (
      <View style={styles.flex}>
        <ScanValidationStage
          imageUri={imageUri}
          cutoutUri={cutoutUri}
          machineName={scanState.data.machineName}
          machineSubtitle={MACHINE_TYPE_LABELS[scanState.data.machineType]}
          needsConfirmation={scanState.data.needsConfirmation}
          onConfirm={() => setIsValidated(true)}
          onRetake={() => router.replace('/camera')}
          onReject={() => router.replace('/')}
        />
        {debugPanel}
      </View>
    );
  }

  // Success — validated: full details.
  return (
    <DetailsStage
      data={scanState.data}
      imageUri={imageUri}
      cutoutUri={cutoutUri}
      onRetake={() => router.replace('/camera')}
    />
  );
}

function toCutoutDebugStatus(state: CutoutState): CutoutDebugStatus {
  switch (state.status) {
    case 'ready':
      return 'success';
    case 'failed':
      return state.errorKind === 'cutout_disabled' ? 'disabled' : 'failed';
    default:
      return state.status;
  }
}

/* -------------------------------------------------------------------------- */
/* Loading stage                                                               */
/* -------------------------------------------------------------------------- */

function LoadingStage({
  imageUri,
  label,
}: {
  imageUri: string;
  label: string;
}) {
  return (
    <Screen style={styles.lightStage}>
      <View style={styles.loadingBody}>
        <View style={styles.loadingCard}>
          <Image
            source={{ uri: imageUri }}
            style={styles.loadingPhoto}
            contentFit="contain"
          />
        </View>
        <ActivityIndicator color="#6B6B6B" size="small" />
        <AppText variant="body" color="textSecondary" align="center">
          {label}
        </AppText>
      </View>
    </Screen>
  );
}

/* -------------------------------------------------------------------------- */
/* Details stage                                                               */
/* -------------------------------------------------------------------------- */

function DetailsStage({
  data,
  imageUri,
  cutoutUri,
  onRetake,
}: {
  data: MachineRecognitionResult;
  imageUri: string;
  cutoutUri?: string;
  onRetake: () => void;
}) {
  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <AppText variant="title">Résultat du scan</AppText>

        <Animated.View
          entering={FadeInUp.delay(80).duration(450)}
          style={styles.detailsBlock}
        >
          <DetailsVisual imageUri={imageUri} cutoutUri={cutoutUri} />
          <MachineResultCard result={data} />
          <SaveBlock data={data} imageUri={imageUri} cutoutUri={cutoutUri} />
        </Animated.View>

        <View style={styles.actions}>
          <PrimaryButton label="Reprendre une photo" onPress={onRetake} />
          <Link href="/" replace asChild>
            <PrimaryButton label="Accueil" variant="ghost" />
          </Link>
        </View>
      </ScrollView>
    </Screen>
  );
}

/**
 * Top visual of the details screen: the real transparent cutout on a light
 * stage with a soft shadow when available, otherwise the honest full photo
 * (contained, never squeezed, never presented as a cutout).
 */
function DetailsVisual({
  imageUri,
  cutoutUri,
}: {
  imageUri: string;
  cutoutUri?: string;
}) {
  if (cutoutUri) {
    return (
      <View style={styles.detailsCutoutStage}>
        <View style={styles.detailsCutoutShadow}>
          <Image
            source={{ uri: cutoutUri }}
            style={styles.detailsCutoutImage}
            contentFit="contain"
          />
        </View>
      </View>
    );
  }
  return (
    <View style={styles.detailsPhotoCard}>
      <Image
        source={{ uri: imageUri }}
        style={styles.detailsPhoto}
        contentFit="contain"
      />
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Error screen                                                                */
/* -------------------------------------------------------------------------- */

function ErrorScreen({
  kind,
  onRetry,
  onRetake,
}: {
  kind: RecognitionErrorKind;
  onRetry: () => void;
  onRetake: () => void;
}) {
  return (
    <Screen style={styles.center}>
      <Card style={styles.stateCard}>
        <AppText variant="subtitle" color="danger">
          Reconnaissance impossible
        </AppText>
        <AppText variant="body" color="textSecondary" align="center">
          {ERROR_MESSAGES[kind]}
        </AppText>
        <PrimaryButton label="Réessayer" onPress={onRetry} />
        <PrimaryButton label="Reprendre une photo" variant="ghost" onPress={onRetake} />
        <Link href="/" replace asChild>
          <PrimaryButton label="Accueil" variant="ghost" />
        </Link>
      </Card>
    </Screen>
  );
}

function MissingImageScreen() {
  return (
    <Screen style={styles.center}>
      <Card style={styles.missingCard}>
        <AppText variant="title" color="danger">
          Image manquante
        </AppText>
        <AppText variant="body" color="textSecondary" align="center">
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

/* -------------------------------------------------------------------------- */
/* Save block                                                                  */
/* -------------------------------------------------------------------------- */

function SaveBlock({
  data,
  imageUri,
  cutoutUri,
}: {
  data: MachineRecognitionResult;
  imageUri: string;
  cutoutUri?: string;
}) {
  const [state, setState] = useState<SaveState>({ status: 'idle' });

  const handleSave = () => {
    setState({ status: 'saving' });
    saveMachineScan(toMachineScanInput(data, imageUri, cutoutUri))
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
  flex: {
    flex: 1,
  },
  lightStage: {
    backgroundColor: '#F8F8F5',
    justifyContent: 'center',
  },
  loadingBody: {
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  loadingCard: {
    width: '82%',
    maxWidth: 340,
    aspectRatio: 4 / 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 8,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 6,
  },
  loadingPhoto: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  scrollContent: {
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  detailsBlock: {
    gap: spacing.md,
  },
  detailsCutoutStage: {
    backgroundColor: '#F8F8F5',
    borderRadius: 20,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  detailsCutoutShadow: {
    width: '78%',
    aspectRatio: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.18,
    shadowRadius: 22,
    elevation: 8,
  },
  detailsCutoutImage: {
    width: '100%',
    height: '100%',
  },
  detailsPhotoCard: {
    backgroundColor: '#F8F8F5',
    borderRadius: 20,
    overflow: 'hidden',
  },
  detailsPhoto: {
    width: '100%',
    aspectRatio: 4 / 3,
  },
  actions: {
    gap: spacing.sm,
  },
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
  saveArea: {
    gap: spacing.xs,
  },
  saveSuccessCard: {
    gap: spacing.sm,
    alignItems: 'stretch',
  },
  missingCard: {
    gap: spacing.sm,
    alignItems: 'stretch',
    width: '100%',
  },
});
