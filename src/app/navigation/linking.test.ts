import {
  createPathConfigForStaticNavigation,
  getStateFromPath,
} from '@react-navigation/native';

import { linking } from './linking';
import { RootStack } from './RootNavigator';

// Built the way createStaticNavigation builds it, from the app's own linking
// options, so a missing option fails here instead of on a device.
const { initialRouteName } = linking.config;
const screens = createPathConfigForStaticNavigation(
  RootStack,
  { initialRouteName },
  true, // linking.enabled is 'auto'
);
const stateFor = (path: string) =>
  getStateFromPath(path, { initialRouteName, screens: screens ?? {} });

describe('deep links (ADR-0006)', () => {
  it('opens repo details with owner and name, with the tabs underneath for Back', () => {
    const state = stateFor('repo/facebook/react-native');

    expect(state?.routes.map(route => route.name)).toEqual([
      'Tabs',
      'RepoDetails',
    ]);
    expect(state?.routes[1]?.params).toEqual({
      owner: 'facebook',
      name: 'react-native',
    });
  });

  it('maps tab paths', () => {
    expect(stateFor('saved')?.routes[0]?.state?.routes.at(-1)?.name).toBe(
      'Saved',
    );
    expect(stateFor('settings')?.routes[0]?.state?.routes.at(-1)?.name).toBe(
      'Settings',
    );
  });
});
