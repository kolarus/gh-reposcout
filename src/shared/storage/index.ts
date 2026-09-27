/** Local persistence: the only place MMKV is used (ADR-0011). */
export {
  appStorage,
  queryCacheStorage,
  savedAvatarStorage,
  savedReposStorage,
  toStateStorage,
  useStoredString,
} from './storage';
