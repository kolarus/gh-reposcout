import { RepoCard, type RepoDetails } from '@/entities/repo';
import {
  SaveToggle,
  useSavedAvatar,
  type SavedRepoSnapshot,
} from '@/features/save-repo';

interface SavedRowProps {
  snapshot: SavedRepoSnapshot;
  now: number;
  onPress: (repo: RepoDetails) => void;
}

/** A saved repo: its snapshot in a `RepoCard`, with the saved avatar (works offline). */
export function SavedRow({ snapshot, now, onPress }: SavedRowProps) {
  const avatarUri = useSavedAvatar(snapshot.repo.owner.login);
  return (
    <RepoCard
      repo={snapshot.repo}
      now={now}
      onPress={onPress}
      avatarUri={avatarUri}
      accessory={<SaveToggle repo={snapshot.repo} />}
    />
  );
}
