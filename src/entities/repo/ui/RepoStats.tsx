import { View } from 'react-native';

import { strings } from '@/shared/i18n';
import { formatInteger, formatRelativeTime, formatSize } from '@/shared/lib';
import { Icon, Text, type IconName } from '@/shared/ui';

import { useStyles } from './RepoStats.styles';
import type { RepoDetails } from '../model/types';

interface Stat {
  icon: IconName;
  label: string;
  value: string;
}

const copy = strings.repoDetails.stats;

function statsOf(repo: RepoDetails, now: Date): Stat[] {
  return [
    { icon: 'star', label: copy.stars, value: formatInteger(repo.stars) },
    {
      icon: 'repo-forked',
      label: copy.forks,
      value: formatInteger(repo.forks),
    },
    {
      icon: 'issue-opened',
      label: copy.openIssues,
      value: formatInteger(repo.openIssues),
    },
    { icon: 'code', label: copy.language, value: repo.language ?? copy.none },
    { icon: 'law', label: copy.license, value: repo.license ?? copy.none },
    {
      icon: 'git-branch',
      label: copy.defaultBranch,
      value: repo.defaultBranch,
    },
    { icon: 'database', label: copy.size, value: formatSize(repo.sizeKb) },
    {
      icon: 'calendar',
      label: copy.created,
      value: formatRelativeTime(repo.createdAt, now),
    },
    {
      icon: 'clock',
      label: copy.updated,
      value: formatRelativeTime(repo.updatedAt, now),
    },
    {
      icon: 'git-commit',
      label: copy.pushed,
      value:
        repo.pushedAt === undefined
          ? copy.none
          : formatRelativeTime(repo.pushedAt, now),
    },
  ];
}

/**
 * The repository's numbers in a two-column grid. Every value comes from the
 * repo record, so the grid is complete whether it came from search or
 * `/repos` (no watchers: search doesn't carry them, ADR-0012).
 */
export function RepoStats({ repo, now }: { repo: RepoDetails; now: number }) {
  const styles = useStyles();
  return (
    <View style={styles.grid}>
      {statsOf(repo, new Date(now)).map(stat => (
        <View
          key={stat.label}
          style={styles.tile}
          accessible
          accessibilityLabel={copy.tile(stat.label, stat.value)}
        >
          <View style={styles.labelRow}>
            <Icon name={stat.icon} size="sm" tone="secondary" />
            <Text variant="caption" tone="secondary" numberOfLines={1}>
              {stat.label}
            </Text>
          </View>
          <Text variant="bodyStrong" numberOfLines={1}>
            {stat.value}
          </Text>
        </View>
      ))}
    </View>
  );
}
