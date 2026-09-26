import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { appStorage, toStateStorage } from '@/shared/storage';

export type ThemePreference = 'system' | 'light' | 'dark';

interface ThemePreferenceState {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

const isThemePreference = (value: unknown): value is ThemePreference =>
  value === 'system' || value === 'light' || value === 'dark';

/**
 * The user's theme choice (ADR-0010), persisted in MMKV. MMKV is synchronous,
 * so the stored value is applied before the first render: no light flash on a
 * dark-mode launch. App-wide infrastructure, so it lives in shared/theme; the
 * Settings UI is the `switch-theme` feature.
 */
export const useThemePreference = create<ThemePreferenceState>()(
  persist(
    set => ({
      preference: 'system',
      setPreference: preference => {
        set({ preference });
      },
    }),
    {
      name: 'theme-preference',
      version: 1,
      storage: createJSONStorage(() => toStateStorage(appStorage)),
      partialize: state => ({ preference: state.preference }),
      // Never trust storage blindly: a corrupted value falls back to the default.
      merge: (persisted, current) => {
        const preference: unknown =
          typeof persisted === 'object' &&
          persisted !== null &&
          'preference' in persisted
            ? persisted.preference
            : undefined;
        return isThemePreference(preference)
          ? { ...current, preference }
          : current;
      },
    },
  ),
);
