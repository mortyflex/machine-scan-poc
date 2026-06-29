import { StyleSheet, View } from 'react-native';

import { AppText, Card, PrimaryButton, Screen } from '@/shared/components';

export default function ScanResultScreen() {
  return (
    <Screen style={styles.screen}>
      <View style={styles.topSpacer} />
      <AppText variant="title" align="center">
        Résultat du scan
      </AppText>
      <Card style={styles.card}>
        <AppText variant="subtitle">Image capturée</AppText>
        <AppText variant="body" color="textSecondary">
          À venir : affichage de la photo puis animation premium de révélation
          du résultat.
        </AppText>
      </Card>
      <Card style={styles.card}>
        <AppText variant="subtitle" color="textSecondary">
          Machine identifiée
        </AppText>
        <AppText variant="body" color="textSecondary">
          À venir : nom de la machine, confiance, description, muscles,
          exercices et action de sauvegarde.
        </AppText>
      </Card>
      <View style={styles.spacer} />
      <PrimaryButton label="Sauvegarder (bientôt)" disabled />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { alignItems: 'stretch', justifyContent: 'flex-end' },
  topSpacer: { height: 8 },
  card: { marginTop: 16, gap: 8 },
  spacer: { flexGrow: 1, minHeight: 24 },
});