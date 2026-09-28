import { PixelRatio } from 'react-native';

import { fetchAsDataUri, sizedAvatarUrl } from '@/shared/api';
import { monitoring } from '@/shared/monitoring';
import { savedAvatarStorage } from '@/shared/storage';

import { useSavedRepos } from '../store/savedRepos';

// The largest size a saved avatar is drawn at (the Details hero, 64 pt);
// rows scale it down. About 10–20 KB per owner.
const AVATAR_POINTS = 64;

export const avatarKey = (login: string) => login.toLowerCase();

const isOwnerSaved = (key: string): boolean =>
  Object.values(useSavedRepos.getState().byId).some(
    snapshot => avatarKey(snapshot.repo.owner.login) === key,
  );

/**
 * Keeps an owner's avatar on the device, once per owner however many of their
 * repos are saved (ADR-0020). A failure isn't fatal: rows fall back to
 * initials, and the next online Details view tries again.
 */
export async function keepOwnerAvatar(owner: {
  login: string;
  avatarUrl: string;
}): Promise<void> {
  const key = avatarKey(owner.login);
  if (savedAvatarStorage.contains(key)) return;
  try {
    const px = AVATAR_POINTS * PixelRatio.get();
    const dataUri = await fetchAsDataUri(sizedAvatarUrl(owner.avatarUrl, px));
    // Unsaved while it downloaded: nothing would ever delete it.
    if (!isOwnerSaved(key)) return;
    savedAvatarStorage.set(key, dataUri);
  } catch (error) {
    monitoring.captureException(error, { action: 'save-avatar' });
  }
}

/** Deletes an owner's avatar once none of their repos is saved any more. */
export function releaseOwnerAvatar(login: string): void {
  const key = avatarKey(login);
  if (!isOwnerSaved(key)) savedAvatarStorage.remove(key);
}

/** Deletes every saved avatar, when all saved repos are removed at once. */
export function releaseAllAvatars(): void {
  savedAvatarStorage.clearAll();
}
