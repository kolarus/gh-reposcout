import { View } from 'react-native';

import { useTheme } from '@/shared/theme';
import { Skeleton } from '@/shared/ui';

import { useStyles } from './RepoDetailsSkeleton.styles';

const STAT_TILES = [0, 1, 2, 3, 4, 5];

/** Details while a deep-linked repo loads: the hero and stats grid's shape. */
export function RepoDetailsSkeleton() {
  const theme = useTheme();
  const styles = useStyles();
  const avatar = theme.avatarSize.lg;
  return (
    <View style={styles.container} testID="repo-details-skeleton">
      <View style={styles.titleRow}>
        <Skeleton width={avatar} height={avatar} radius="pill" />
        <View style={styles.titles}>
          <Skeleton width="40%" height={theme.typography.body.lineHeight - 4} />
          <Skeleton
            width="70%"
            height={theme.typography.title.lineHeight - 6}
          />
        </View>
      </View>
      <Skeleton width="100%" height={theme.typography.body.lineHeight * 2} />
      <View style={styles.grid}>
        {STAT_TILES.map(key => (
          <View key={key} style={styles.tile}>
            <Skeleton
              width="50%"
              height={theme.typography.caption.lineHeight - 4}
            />
            <Skeleton
              width="70%"
              height={theme.typography.bodyStrong.lineHeight - 4}
            />
          </View>
        ))}
      </View>
    </View>
  );
}
