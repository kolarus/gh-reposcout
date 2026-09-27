import { View } from 'react-native';

import { strings } from '@/shared/i18n';
import { formatInteger } from '@/shared/lib';
import { Text } from '@/shared/ui';

import { useStyles } from './ResultsHeader.styles';
import type { SearchResults } from '../model/searchResults';

/** Total match count, plus a notice when GitHub returned partial results. */
export function ResultsHeader({ results }: { results: SearchResults }) {
  const styles = useStyles();
  return (
    <View style={styles.container}>
      <Text variant="captionStrong" tone="secondary" accessibilityRole="header">
        {strings.search.resultsCount(
          results.totalCount,
          formatInteger(results.totalCount),
        )}
      </Text>
      {results.incompleteResults ? (
        <Text variant="caption" tone="warning">
          {strings.search.incomplete}
        </Text>
      ) : null}
    </View>
  );
}
