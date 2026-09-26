import { useNavigation } from '@react-navigation/native';

import { strings } from '@/shared/i18n';
import { StateView } from '@/shared/ui';

/** Placeholder until repository search lands in Phase 2. */
export function SearchScreen() {
  const navigation = useNavigation();

  return (
    <StateView
      icon="search"
      title={strings.placeholders.searchTitle}
      message={strings.placeholders.searchMessage}
      action={{
        label: strings.placeholders.searchSample,
        onPress: () => {
          navigation.navigate('RepoDetails', {
            owner: 'facebook',
            name: 'react-native',
          });
        },
      }}
    />
  );
}
