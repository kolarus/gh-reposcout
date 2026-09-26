import { createMMKV, type MMKV } from 'react-native-mmkv';
import type { StateStorage } from 'zustand/middleware';

/**
 * MMKV instances, one per purpose (ADR-0011). Reads are synchronous, so
 * persisted Zustand stores are ready before the first render (no flash).
 * The query-cache and saved-repo instances arrive with their features.
 */
export const appStorage = createMMKV({ id: 'app' });

/** Adapts an MMKV instance to Zustand's `persist` storage interface. */
export function toStateStorage(storage: MMKV): StateStorage {
  return {
    getItem: key => storage.getString(key) ?? null,
    setItem: (key, value) => {
      storage.set(key, value);
    },
    removeItem: key => {
      storage.remove(key);
    },
  };
}
