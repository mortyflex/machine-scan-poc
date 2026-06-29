import { Link, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { AppText, Card, PrimaryButton, Screen } from '@/shared/components';

export default function ScanResultScreen() {
  const { imageUri } = useLocalSearchParams<{ imageUri?: string }>();
  const hasImage = Boolean(imageUri);

  return (
    <Screen style={styles.screen}>
      <View style={styles.topSpacer} />

      <AppText variant="title" align="center">
        Résultat du scan
      </AppText>

      {hasImage ? (
        <Card style={styles.imageCard}>
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            contentFit="contain"
          />
        </Card>
      ) : (
        <Card style={styles.missingCard}>
          <AppText variant="subtitle" color="danger">
            Image manquante
          </AppText>
          <AppText variant="body" color="textSecondary">
            Aucune photo capturée n&apos;a été transmise. Retourne à la caméra
            pour scanner une machine.
          </AppText>
          <Link href="/camera" asChild>
            <PrimaryButton label="Ouvrir la caméra" />
          </Link>
        </Card>
      )}

      <Card style={styles.placeholder}>
        <AppText variant="subtitle" color="textSecondary">
          Reconnaissance IA à venir
        </AppText>
        <AppText variant="body" color="textSecondary">
          À venir — Phase 3 (contract IA) puis Phase 4 (écran de résultat) :
          nom de la machine, confiance, description, muscles, exercices et
          bouton de sauvegarde.
        </AppText>
      </Card>

      <View style={styles.spacer} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { alignItems: 'stretch' },
  topSpacer: { height: 8 },
  imageCard: {
    marginTop: 16,
    overflow: 'hidden',
    padding: 0,
  },
  image: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: '#000',
  },
  missingCard: { marginTop: 16, gap: 12, alignItems: 'flex-start' },
  placeholder: { marginTop: 16, gap: 8 },
  spacer: { flexGrow: 1, minHeight: 16 },
});