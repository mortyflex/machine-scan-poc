import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

import {
  SavedMachineCard,
  SavedMachinesEmptyState,
} from '@/features/machine-scan/components';
import {
  listSavedMachineScans,
  type StorageErrorKind,
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
import { spacing, useAppTheme } from '@/shared/theme';

type ListState =
  | { status: 'loading' }
  | { status: 'success'; machines: MachineScan[] }
  | { status: 'error'; kind: StorageErrorKind };

export default function SavedMachinesScreen() {
  const theme = useAppTheme();
  const [state, setState] = useState<ListState>({ status: 'loading' });

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setState({ status: 'loading' });
      listSavedMachineScans().then((result) => {
        if (cancelled) return;
        if (result.ok) {
          setState({ status: 'success', machines: result.data });
        } else {
          setState({ status: 'error', kind: result.error.kind });
        }
      });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const renderContent = () => {
    if (state.status === 'loading') {
      return (
        <View style={styles.statePad}>
          <Card style={styles.stateCard}>
            <ActivityIndicator color={theme.colors.primary} />
            <AppText variant="body" color="textSecondary" align="center">
              Chargement des machines…
            </AppText>
          </Card>
        </View>
      );
    }

    if (state.status === 'error') {
      return (
        <View style={styles.statePad}>
          <Card style={styles.stateCard}>
            <AppText variant="subtitle" color="danger">
              Chargement impossible
            </AppText>
            <AppText variant="body" color="textSecondary">
              Les machines sauvegardées sont indisponibles pour le moment.
            </AppText>
          </Card>
        </View>
      );
    }

    if (state.machines.length === 0) {
      return (
        <View style={styles.statePad}>
          <SavedMachinesEmptyState />
        </View>
      );
    }

    return (
      <FlatList
        data={state.machines}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <SavedMachineCard machine={item} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    );
  };

  return (
    <Screen style={styles.screen}>
      <PremiumDottedBackground />
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <BackButton />
          <AppText variant="title" style={styles.headerTitle}>
            Machines sauvegardées
          </AppText>
        </View>
        <Link href="/camera" replace asChild>
          <PrimaryButton label="Scanner une machine" variant="ghost" />
        </Link>
      </View>
      {renderContent()}
    </Screen>
  );
}

const styles = StyleSheet.create({
  // Unpadded screen so the dotted premium background bleeds edge to edge
  // (Yoga offsets absolute children by parent padding); the content
  // paddings live on the header and list instead.
  screen: {
    paddingHorizontal: 0,
  },
  header: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'stretch',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    flex: 1,
  },
  statePad: {
    paddingHorizontal: spacing.lg,
  },
  stateCard: {
    gap: spacing.sm,
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  separator: {
    height: spacing.sm,
  },
});
