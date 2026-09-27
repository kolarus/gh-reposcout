import { useSyncExternalStore } from 'react';
import { createMMKV, type MMKV } from 'react-native-mmkv';
import type { StateStorage } from 'zustand/middleware';

/**
 * MMKV instances, one per purpose (ADR-0011). Reads are synchronous, so
 * persisted Zustand stores are ready before the first render (no flash).
 * The query-cache instance arrives with query persistence (Phase 4).
 */
export const appStorage = createMMKV({ id: 'app' });
/** Saved-repo snapshots (ADR-0020): kept until the user removes them. */
export const savedReposStorage = createMMKV({ id: 'saved' });
/** Owners' avatars for saved repos, as data URIs keyed by login (ADR-0020). */
export const savedAvatarStorage = createMMKV({ id: 'saved-avatars' });

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

/**
 * One string value from an MMKV instance, re-rendering when it changes. For
 * values kept outside a Zustand store, such as saved avatars.
 */
export function useStoredString(
  storage: MMKV,
  key: string | undefined,
): string | undefined {
  return useSyncExternalStore(
    onChange => {
      const listener = storage.addOnValueChangedListener(changedKey => {
        if (changedKey === key) onChange();
      });
      return () => {
        listener.remove();
      };
    },
    () => (key === undefined ? undefined : storage.getString(key)),
  );
}
