import { Platform, Share } from 'react-native';

import type { RepoDetails } from '@/entities/repo';
import { monitoring } from '@/shared/monitoring';

/**
 * Opens the system share sheet with the repo's GitHub link. iOS shares a
 * `url` (rich preview); Android only understands text, so the link goes in
 * `message`. Passing both would share the link twice on iOS.
 */
export async function shareRepo(repo: RepoDetails): Promise<void> {
  try {
    await Share.share(
      Platform.OS === 'ios'
        ? { url: repo.htmlUrl }
        : { message: repo.htmlUrl, title: repo.fullName },
    );
  } catch (error) {
    monitoring.captureException(error, { action: 'share-repo' });
  }
}
