import type * as StorageModule from '@/shared/storage';
import { appStorage } from '@/shared/storage';

import type * as ThemePreferenceModule from './themePreference';
import { useThemePreference } from './themePreference';

const KEY = 'theme-preference';

afterEach(() => {
  useThemePreference.getState().setPreference('system');
});

describe('useThemePreference persistence', () => {
  it('writes the preference to MMKV', () => {
    useThemePreference.getState().setPreference('dark');

    expect(JSON.parse(appStorage.getString(KEY) ?? '{}')).toMatchObject({
      state: { preference: 'dark' },
    });
  });

  it('restores a stored preference (as on the next launch)', async () => {
    appStorage.set(
      KEY,
      JSON.stringify({ state: { preference: 'dark' }, version: 1 }),
    );

    await useThemePreference.persist.rehydrate();

    expect(useThemePreference.getState().preference).toBe('dark');
  });

  it('is hydrated as soon as the store is created, so the first render already uses it', () => {
    // A fresh module registry stands in for a cold start: the store module is
    // evaluated again, against storage that already holds a preference.
    jest.isolateModules(() => {
      jest
        .requireActual<typeof StorageModule>('@/shared/storage')
        .appStorage.set(
          KEY,
          JSON.stringify({ state: { preference: 'dark' }, version: 1 }),
        );

      const fresh =
        jest.requireActual<typeof ThemePreferenceModule>(
          './themePreference',
        ).useThemePreference;

      // Checked synchronously, with nothing awaited: no default-theme flash.
      expect(fresh.persist.hasHydrated()).toBe(true);
      expect(fresh.getState().preference).toBe('dark');
    });
  });

  it('falls back to the default when storage holds garbage', async () => {
    appStorage.set(
      KEY,
      JSON.stringify({ state: { preference: 'purple' }, version: 1 }),
    );
    useThemePreference.setState({ preference: 'system' });

    await useThemePreference.persist.rehydrate();

    expect(useThemePreference.getState().preference).toBe('system');
  });
});
