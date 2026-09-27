import { View } from 'react-native';

import type { RepoDetails } from '@/entities/repo';
import { strings } from '@/shared/i18n';
import { haptics, openExternalUrl } from '@/shared/lib';
import { Button } from '@/shared/ui';

import { useStyles } from './RepoActions.styles';
import { shareRepo } from '../lib/shareRepo';

/** What you can do with a repository: open it on GitHub, or share its link. */
export function RepoActions({ repo }: { repo: RepoDetails }) {
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <View style={styles.action}>
        <Button
          label={strings.repoDetails.openOnGitHub}
          icon="link-external"
          onPress={() => {
            void openExternalUrl(repo.htmlUrl);
          }}
        />
      </View>
      <View style={styles.action}>
        <Button
          label={strings.repoDetails.share}
          icon="share"
          variant="secondary"
          onPress={() => {
            haptics.impact();
            void shareRepo(repo);
          }}
        />
      </View>
    </View>
  );
}
