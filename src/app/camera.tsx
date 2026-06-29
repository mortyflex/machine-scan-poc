import { StyleSheet, View } from 'react-native';

import { AppText, Card, PrimaryButton, Screen } from '@/shared/components';

export default function CameraScreen() {
  return (
    <Screen style={styles.screen}>
      <View style={styles.placeholderArea}>
        <Card style={styles.placeholderCard}>
          <AppText variant="title" align="center">
            Caméra
          </AppText>
          <AppText variant="body" color="textSecondary" align="center">
            L&apos;aperçu caméra et la capture de photo seront ajoutés dans la
            phase suivante.
          </AppText>
          <AppText variant="caption" color="textMuted" align="center">
            États prévus : permission accordée, permission refusée, capture en
            cours, erreur.
          </AppText>
        </Card>
      </View>
      <PrimaryButton label="Capturer (bientôt)" disabled />
      <View style={styles.bottomSpacer} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { justifyContent: 'flex-end' },
  placeholderArea: { flex: 1, justifyContent: 'center' },
  placeholderCard: { alignItems: 'center', gap: 12 },
  bottomSpacer: { height: 16 },
});