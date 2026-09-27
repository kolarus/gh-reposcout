import type { ReactNode } from 'react';
import { PixelRatio, Pressable, View } from 'react-native';

import { sizedAvatarUrl } from '@/shared/api';
import { strings } from '@/shared/i18n';
import {
  formatCompactNumber,
  formatInteger,
  formatRelativeTime,
} from '@/shared/lib';
import { useTheme } from '@/shared/theme';
import { Avatar, Icon, Text } from '@/shared/ui';

import { LanguageDot } from './LanguageDot';
import { useStyles } from './RepoCard.styles';
import type { RepoDetails } from '../model/types';

interface RepoCardProps {
  repo: RepoDetails;
  /** Current time (epoch ms) for "Updated 3d ago"; passed in so rows stay pure. */
  now: number;
  onPress: (repo: RepoDetails) => void;
  /** Overrides the avatar, e.g. a saved copy that works offline (ADR-0020). */
  avatarUri?: string | undefined;
  /** Not pressable, e.g. while the list shows a previous search's results. */
  disabled?: boolean;
  /** Slot for feature UI such as the save toggle (ADR-0005). */
  accessory?: ReactNode;
}

/**
 * A repository row (ADR-0009): fixed shape (description clamped to two lines,
 * one metadata line), a server-sized avatar, and a single press handler that
 * receives the repo, so the list passes one stable function to every row.
 */
export function RepoCard({
  repo,
  now,
  onPress,
  avatarUri,
  disabled = false,
  accessory,
}: RepoCardProps) {
  const theme = useTheme();
  const styles = useStyles();
  const avatarPx = theme.avatarSize.md * PixelRatio.get();
  const updated = strings.repo.updated(
    formatRelativeTime(repo.updatedAt, new Date(now)),
  );
  const label = strings.repo.cardLabel(
    [
      repo.fullName,
      repo.description,
      strings.repo.starsLabel(formatInteger(repo.stars)),
      repo.language,
      updated,
    ].filter(part => part !== undefined),
  );

  return (
    <Pressable
      onPress={() => {
        onPress(repo);
      }}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <Avatar
        uri={avatarUri ?? sizedAvatarUrl(repo.owner.avatarUrl, avatarPx)}
        name={repo.owner.login}
        size="md"
      />
      <View style={styles.body}>
        <Text numberOfLines={1}>
          <Text tone="secondary">{`${repo.owner.login} / `}</Text>
          <Text variant="bodyStrong">{repo.name}</Text>
        </Text>
        {repo.description !== undefined ? (
          <Text variant="caption" tone="secondary" numberOfLines={2}>
            {repo.description}
          </Text>
        ) : null}
        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Icon name="star" size="sm" tone="secondary" />
            <Text variant="caption" tone="secondary">
              {formatCompactNumber(repo.stars)}
            </Text>
          </View>
          {repo.language !== undefined ? (
            <View style={styles.metaItem}>
              <LanguageDot language={repo.language} />
              <Text variant="caption" tone="secondary" numberOfLines={1}>
                {repo.language}
              </Text>
            </View>
          ) : null}
          <Text
            variant="caption"
            tone="secondary"
            numberOfLines={1}
            style={styles.updated}
          >
            {updated}
          </Text>
        </View>
      </View>
      {accessory}
    </Pressable>
  );
}
