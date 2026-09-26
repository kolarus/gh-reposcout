import { create } from 'zustand';

export type ThemePreference = 'system' | 'light' | 'dark';

interface ThemePreferenceState {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

/**
 * The user's theme choice (ADR-0010). App-wide infrastructure, so it lives in
 * shared/theme; the Settings UI to change it is the `switch-theme` feature.
 * Persisted with MMKV once shared/storage lands (Phase 1b).
 */
export const useThemePreference = create<ThemePreferenceState>()(set => ({
  preference: 'system',
  setPreference: preference => {
    set({ preference });
  },
}));
