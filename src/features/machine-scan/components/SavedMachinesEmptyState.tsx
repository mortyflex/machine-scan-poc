import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';

import { AppText, Card, PrimaryButton } from '@/shared/components';
import { spacing } from '@/shared/theme';

export function SavedMachinesEmptyState() {
  return (
    <Card style={styles.card}>
      <AppText variant="subtitle">Aucune machine enregistrée</AppText>
      <AppText variant="body" color="textSecondary">
        Scanne une machine puis sauvegarde-la pour la retrouver ici.
      </AppText>
      <Link href="/camera" replace asChild>
        <PrimaryButton label="Scanner une machine" />
      </Link>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.md,
    gap: spacing.sm,
    alignItems: 'stretch',
  },
});
