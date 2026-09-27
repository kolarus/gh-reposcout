/** Local persistence: the only place MMKV is used (ADR-0011). */
export {
  appStorage,
  savedAvatarStorage,
  savedReposStorage,
  toStateStorage,
  useStoredString,
} from './storage';
