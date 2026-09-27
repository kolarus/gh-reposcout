import { Pressable } from 'react-native';

import type { RepoDetails } from '@/entities/repo';
import { strings } from '@/shared/i18n';
import { haptics } from '@/shared/lib';
import { Icon } from '@/shared/ui';

import { useStyles } from './SaveToggle.styles';
import { useIsSaved, useToggleSaved } from '../hooks/useSaved';

/**
 * The bookmark that saves a repo for offline use (ADR-0020). It subscribes to
 * its own repo's saved flag only, so toggling one repo re-renders one toggle.
 */
export function SaveToggle({ repo }: { repo: RepoDetails }) {
  const styles = useStyles();
  const isSaved = useIsSaved(repo.id);
  const toggle = useToggleSaved();
  return (
    <Pressable
      onPress={() => {
        haptics.impact();
        toggle(repo);
      }}
      accessibilityRole="button"
      accessibilityLabel={
        isSaved
          ? strings.saved.remove(repo.fullName)
          : strings.saved.save(repo.fullName)
      }
      accessibilityState={{ selected: isSaved }}
      hitSlop={4}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Icon
        name={isSaved ? 'bookmark-filled' : 'bookmark'}
        tone={isSaved ? 'accent' : 'secondary'}
      />
    </Pressable>
  );
}
