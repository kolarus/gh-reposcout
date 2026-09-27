import { ActivityIndicator, View } from 'react-native';

import type { ApiError } from '@/shared/api';
import { strings } from '@/shared/i18n';
import { useTheme } from '@/shared/theme';
import { Button, Text } from '@/shared/ui';

import { useStyles } from './SearchFooter.styles';

interface SearchFooterProps {
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  nextPageError: ApiError | undefined;
  /** The list ended at GitHub's 1,000-result cap, not at the real end. */
  reachedCap: boolean;
  onRetry: () => void;
}

/** End of the results list: loading more, a failed page, the cap, or the end. */
export function SearchFooter({
  isFetchingNextPage,
  hasNextPage,
  nextPageError,
  reachedCap,
  onRetry,
}: SearchFooterProps) {
  const theme = useTheme();
  const styles = useStyles();
  const copy = strings.search.footer;

  if (isFetchingNextPage) {
    return (
      <View style={styles.container}>
        <ActivityIndicator
          color={theme.colors.accent}
          accessibilityLabel={copy.loadingMore}
        />
      </View>
    );
  }
  if (nextPageError !== undefined) {
    return (
      <View style={styles.container}>
        {nextPageError.kind === 'rate-limited' ? (
          <Text variant="caption" tone="secondary" style={styles.text}>
            {copy.paused}
          </Text>
        ) : (
          <>
            <Text variant="caption" tone="secondary" style={styles.text}>
              {copy.loadMoreFailed}
            </Text>
            <Button label={copy.retry} onPress={onRetry} variant="plain" />
          </>
        )}
      </View>
    );
  }
  if (hasNextPage) return <View style={styles.container} />;
  return (
    <View style={styles.container}>
      <Text variant="caption" tone="secondary" style={styles.text}>
        {reachedCap ? copy.cap : copy.end}
      </Text>
    </View>
  );
}
