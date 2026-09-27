/** Save repositories for offline use: snapshots, avatars and the toggle (ADR-0005, ADR-0020). */
export type { SavedRepoSnapshot } from './model/types';
export {
  useSavedAvatar,
  useSavedList,
  useSavedSnapshot,
  useSyncSnapshot,
} from './hooks/useSaved';
export { SaveToggle } from './ui/SaveToggle';
