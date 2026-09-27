import { Pressable, ScrollView, View } from 'react-native';

import { strings } from '@/shared/i18n';
import { Chip, Icon, Text } from '@/shared/ui';

import { useStyles } from './SearchSuggestions.styles';

interface SearchSuggestionsProps {
  recent: readonly string[];
  onSelect: (query: string) => void;
  onRemove: (query: string) => void;
}

/** The idle state: recent searches (removable) and a few suggested queries. */
export function SearchSuggestions({
  recent,
  onSelect,
  onRemove,
}: SearchSuggestionsProps) {
  const styles = useStyles();

  return (
    <ScrollView
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.content}
    >
      {recent.length > 0 ? (
        <View style={styles.section}>
          <Text
            variant="captionStrong"
            tone="secondary"
            accessibilityRole="header"
          >
            {strings.search.recent.title}
          </Text>
          {recent.map(query => (
            <View key={query} style={styles.recentRow}>
              <Pressable
                onPress={() => {
                  onSelect(query);
                }}
                accessibilityRole="button"
                accessibilityLabel={query}
                style={({ pressed }) => [
                  styles.recentQuery,
                  pressed && styles.pressed,
                ]}
              >
                <Icon name="history" size="sm" tone="secondary" />
                <Text numberOfLines={1} style={styles.recentText}>
                  {query}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  onRemove(query);
                }}
                accessibilityRole="button"
                accessibilityLabel={strings.search.recent.remove(query)}
                hitSlop={8}
                style={styles.remove}
              >
                <Icon name="x" size="sm" tone="secondary" />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.section}>
        <Text
          variant="captionStrong"
          tone="secondary"
          accessibilityRole="header"
        >
          {strings.search.suggestions.title}
        </Text>
        <View style={styles.chips}>
          {strings.search.suggestions.queries.map(query => (
            <Chip
              key={query}
              label={query}
              icon="search"
              onPress={() => {
                onSelect(query);
              }}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
