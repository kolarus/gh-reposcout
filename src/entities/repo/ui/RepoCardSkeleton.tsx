import { View } from 'react-native';

import { useTheme } from '@/shared/theme';
import { Skeleton } from '@/shared/ui';

import { useStyles } from './RepoCardSkeleton.styles';

/** Loading placeholder with `RepoCard`'s exact shape, so nothing jumps when rows arrive. */
export function RepoCardSkeleton() {
  const theme = useTheme();
  const styles = useStyles();
  const avatar = theme.avatarSize.md;
  return (
    <View style={styles.container}>
      <Skeleton width={avatar} height={avatar} radius="pill" />
      <View style={styles.body}>
        <Skeleton width="55%" height={theme.typography.body.lineHeight - 4} />
        <Skeleton
          width="95%"
          height={theme.typography.caption.lineHeight - 4}
        />
        <Skeleton
          width="40%"
          height={theme.typography.caption.lineHeight - 4}
        />
      </View>
    </View>
  );
}
