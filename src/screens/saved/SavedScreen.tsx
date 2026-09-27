import { useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { View } from 'react-native';

import type { RepoDetails } from '@/entities/repo';
import { useSavedList, type SavedRepoSnapshot } from '@/features/save-repo';
import { strings } from '@/shared/i18n';
import { useNow } from '@/shared/lib';
import { Divider, StateView, Text } from '@/shared/ui';

import { useStyles } from './SavedScreen.styles';
import { SavedRow } from './ui/SavedRow';

const keyExtractor = (snapshot: SavedRepoSnapshot) => String(snapshot.repo.id);

/**
 * Saved repositories, most recently saved first (ADR-0020). Everything here
 * comes from the device, so the tab works fully offline.
 */
export function SavedScreen() {
  const navigation = useNavigation();
  const styles = useStyles();
  const saved = useSavedList();
  const now = useNow(60_000);

  if (saved.length === 0) {
    return (
      <StateView
        icon="bookmark"
        title={strings.saved.emptyTitle}
        message={strings.saved.emptyMessage}
      />
    );
  }

  const openRepo = (repo: RepoDetails) => {
    navigation.navigate('RepoDetails', {
      owner: repo.owner.login,
      name: repo.name,
    });
  };

  return (
    <View style={styles.screen}>
      <FlashList
        data={saved}
        keyExtractor={keyExtractor}
        renderItem={({ item }) => (
          <SavedRow snapshot={item} now={now} onPress={openRepo} />
        )}
        extraData={now}
        ItemSeparatorComponent={Divider}
        ListHeaderComponent={
          <Text
            variant="captionStrong"
            tone="secondary"
            accessibilityRole="header"
            style={styles.header}
          >
            {strings.saved.count(saved.length)}
          </Text>
        }
      />
    </View>
  );
}
