import type { StaticScreenProps } from '@react-navigation/native';

import { isValidRepoRef } from '@/entities/repo';
import { strings } from '@/shared/i18n';
import { StateView } from '@/shared/ui';

import { RepoDetailsBody } from './ui/RepoDetailsBody';

// Route params are a plain object type (React Navigation needs an index-signature-compatible type).
type RepoDetailsScreenProps = StaticScreenProps<{
  owner: string;
  name: string;
}>;

/**
 * Repository details. Route params carry only the owner and name (ADR-0006),
 * validated before anything is requested.
 */
export function RepoDetailsScreen({ route }: RepoDetailsScreenProps) {
  const { owner, name } = route.params;

  if (!isValidRepoRef({ owner, name })) {
    return (
      <StateView
        icon="alert"
        title={strings.repoDetails.invalidTitle}
        message={strings.repoDetails.invalidMessage}
      />
    );
  }

  return <RepoDetailsBody repoRef={{ owner, name }} />;
}
