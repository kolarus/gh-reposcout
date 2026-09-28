import { PixelRatio, View } from 'react-native';

import { sizedAvatarUrl } from '@/shared/api';
import { strings } from '@/shared/i18n';
import { useTheme } from '@/shared/theme';
import { Avatar, Banner, Button, Chip, Text } from '@/shared/ui';

import { useStyles } from './RepoHero.styles';
import type { RepoDetails } from '../model/types';

interface RepoHeroProps {
  repo: RepoDetails;
  /** Opens a link (the homepage); the screen decides how. */
  onOpenUrl: (url: string) => void;
  /** Overrides the avatar, e.g. a saved copy that works offline (ADR-0020). */
  avatarUri?: string | undefined;
}

const hostOf = (url: string) =>
  url.replace(/^https:\/\//i, '').replace(/\/$/, '');

/** The top of Details: owner and name, full description, website, topics. */
export function RepoHero({ repo, onOpenUrl, avatarUri }: RepoHeroProps) {
  const theme = useTheme();
  const styles = useStyles();
  const avatarPx = theme.avatarSize.lg * PixelRatio.get();
  const { homepageUrl } = repo;

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Avatar
          uri={avatarUri ?? sizedAvatarUrl(repo.owner.avatarUrl, avatarPx)}
          name={repo.owner.login}
          size="lg"
        />
        <View style={styles.titles}>
          <Text tone="secondary" numberOfLines={1}>
            {repo.owner.login}
          </Text>
          <Text variant="title" accessibilityRole="header">
            {repo.name}
          </Text>
        </View>
      </View>
      {repo.archived ? (
        <Banner
          tone="warning"
          icon="archive"
          message={strings.repoDetails.archived}
        />
      ) : null}
      {repo.description !== undefined ? <Text>{repo.description}</Text> : null}
      {homepageUrl !== undefined ? (
        <View style={styles.link}>
          <Button
            label={hostOf(homepageUrl)}
            accessibilityLabel={strings.repoDetails.homepage(
              hostOf(homepageUrl),
            )}
            icon="link-external"
            variant="plain"
            onPress={() => {
              onOpenUrl(homepageUrl);
            }}
          />
        </View>
      ) : null}
      {repo.topics.length > 0 ? (
        <View
          style={styles.topics}
          // One element for the whole group: a label alone is ignored on iOS.
          accessible
          accessibilityLabel={strings.repoDetails.topics(repo.topics)}
        >
          {repo.topics.map(topic => (
            <Chip key={topic} label={topic} />
          ))}
        </View>
      ) : null}
    </View>
  );
}
