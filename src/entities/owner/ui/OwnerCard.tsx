import { PixelRatio, Pressable, View } from 'react-native';

import { sizedAvatarUrl } from '@/shared/api';
import { strings } from '@/shared/i18n';
import { formatInteger, formatMinutesUntil, useNow } from '@/shared/lib';
import { useTheme } from '@/shared/theme';
import { Avatar, Button, Icon, Skeleton, Text } from '@/shared/ui';

import { useStyles } from './OwnerCard.styles';
import type { OwnerProfile } from '../model/types';

/** What the card can say about the profile below the owner's name. */
export type OwnerSection =
  | { kind: 'profile'; profile: OwnerProfile }
  | { kind: 'loading' }
  /** Held back by the core-budget reserve (ADR-0012); the user can load it. */
  | { kind: 'paused'; resetAt: string }
  | { kind: 'rate-limited'; resetAt: string }
  | { kind: 'error' }
  | { kind: 'offline' }
  /** A saved repo shown offline, saved before its owner's profile loaded. */
  | { kind: 'not-saved' };

interface OwnerCardProps {
  /** What the repo already says about its owner: shown at once. */
  login: string;
  avatarUrl: string;
  /** Overrides the avatar, e.g. a saved copy that works offline (ADR-0020). */
  savedAvatarUri?: string | undefined;
  kind: 'user' | 'organization';
  section: OwnerSection;
  onLoadNow: () => void;
  onRetry: () => void;
  onOpenUrl: (url: string) => void;
}

const copy = strings.owner;

/**
 * The owner of a repository. Login, avatar and account type come with the
 * repo, so they show immediately; the profile (name, bio, followers) loads
 * separately and fails on its own, never taking the screen down (ADR-0018).
 */
export function OwnerCard({
  login,
  avatarUrl,
  savedAvatarUri,
  kind,
  section,
  onLoadNow,
  onRetry,
  onOpenUrl,
}: OwnerCardProps) {
  const theme = useTheme();
  const styles = useStyles();
  const now = useNow(30_000);
  const profile = section.kind === 'profile' ? section.profile : undefined;
  const profileUrl = profile?.htmlUrl ?? `https://github.com/${login}`;
  const avatarPx = theme.avatarSize.md * PixelRatio.get();

  const body = (() => {
    switch (section.kind) {
      case 'profile':
        return (
          <ProfileDetails profile={section.profile} onOpenUrl={onOpenUrl} />
        );
      case 'loading':
        return (
          <View
            style={styles.lines}
            accessible
            accessibilityLabel={copy.loading}
          >
            <Skeleton
              width="90%"
              height={theme.typography.body.lineHeight - 4}
            />
            <Skeleton
              width="60%"
              height={theme.typography.caption.lineHeight - 4}
            />
          </View>
        );
      case 'paused':
        return (
          <View style={styles.notice}>
            <Text variant="caption" tone="secondary">
              {copy.pausedMessage(formatMinutesUntil(section.resetAt, now))}
            </Text>
            <Button label={copy.loadNow} variant="plain" onPress={onLoadNow} />
          </View>
        );
      case 'rate-limited':
        return (
          <Text variant="caption" tone="secondary">
            {copy.rateLimitedMessage(formatMinutesUntil(section.resetAt, now))}
          </Text>
        );
      case 'error':
        return (
          <View style={styles.notice}>
            <Text variant="caption" tone="secondary">
              {copy.errorMessage}
            </Text>
            <Button label={copy.retry} variant="plain" onPress={onRetry} />
          </View>
        );
      case 'offline':
        return (
          <Text variant="caption" tone="secondary">
            {copy.offlineMessage}
          </Text>
        );
      case 'not-saved':
        return (
          <Text variant="caption" tone="secondary">
            {copy.notSaved}
          </Text>
        );
    }
  })();

  return (
    <View style={styles.card}>
      <Pressable
        onPress={() => {
          onOpenUrl(profileUrl);
        }}
        accessibilityRole="link"
        accessibilityLabel={copy.openProfile(login)}
        style={({ pressed }) => [styles.header, pressed && styles.pressed]}
      >
        <Avatar
          uri={savedAvatarUri ?? sizedAvatarUrl(avatarUrl, avatarPx)}
          name={login}
          size="md"
        />
        <View style={styles.names}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {profile?.name ?? login}
          </Text>
          <Text variant="caption" tone="secondary" numberOfLines={1}>
            {`@${login} · ${kind === 'organization' ? copy.organization : copy.user}`}
          </Text>
        </View>
        <Icon name="link-external" size="sm" tone="secondary" />
      </Pressable>
      {body}
    </View>
  );
}

function ProfileDetails({
  profile,
  onOpenUrl,
}: {
  profile: OwnerProfile;
  onOpenUrl: (url: string) => void;
}) {
  const styles = useStyles();
  const { blogUrl } = profile;
  return (
    <View style={styles.lines}>
      {profile.bio !== undefined ? <Text>{profile.bio}</Text> : null}
      {profile.company !== undefined ? (
        <View style={styles.meta}>
          <Icon name="organization" size="sm" tone="secondary" />
          <Text variant="caption" tone="secondary" numberOfLines={1}>
            {profile.company}
          </Text>
        </View>
      ) : null}
      {profile.location !== undefined ? (
        <View style={styles.meta}>
          <Icon name="location" size="sm" tone="secondary" />
          <Text variant="caption" tone="secondary" numberOfLines={1}>
            {profile.location}
          </Text>
        </View>
      ) : null}
      {blogUrl !== undefined ? (
        <View style={styles.link}>
          <Button
            label={blogUrl.replace(/^https:\/\//i, '').replace(/\/$/, '')}
            icon="link-external"
            variant="plain"
            onPress={() => {
              onOpenUrl(blogUrl);
            }}
          />
        </View>
      ) : null}
      <Text variant="caption" tone="secondary">
        {`${copy.followers(formatInteger(profile.followers))} · ${copy.publicRepos(formatInteger(profile.publicRepos))}`}
      </Text>
    </View>
  );
}
