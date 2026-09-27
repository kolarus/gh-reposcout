import { ScrollView } from 'react-native';

import { strings } from '@/shared/i18n';
import { Chip } from '@/shared/ui';

import { useStyles } from './SortPicker.styles';
import { SEARCH_SORTS, type SearchSort } from '../model/searchParams';

const LABELS: Readonly<Record<SearchSort, string>> = {
  'best-match': strings.search.sort.bestMatch,
  stars: strings.search.sort.stars,
  updated: strings.search.sort.updated,
};

interface SortPickerProps {
  value: SearchSort;
  onChange: (sort: SearchSort) => void;
}

/** Sort chips. Changing sort keeps the current results until the new ones arrive. */
export function SortPicker({ value, onChange }: SortPickerProps) {
  const styles = useStyles();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      accessibilityLabel={strings.search.sort.label}
      contentContainerStyle={styles.row}
    >
      {SEARCH_SORTS.map(sort => (
        <Chip
          key={sort}
          label={LABELS[sort]}
          selected={sort === value}
          onPress={() => {
            onChange(sort);
          }}
        />
      ))}
    </ScrollView>
  );
}
