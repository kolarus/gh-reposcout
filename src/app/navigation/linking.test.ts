import {
  createPathConfigForStaticNavigation,
  getStateFromPath,
} from '@react-navigation/native';

import { RootStack } from './RootNavigator';

const screens = createPathConfigForStaticNavigation(
  RootStack,
  { initialRouteName: 'Tabs' },
  true,
);
const stateFor = (path: string) =>
  getStateFromPath(path, { initialRouteName: 'Tabs', screens: screens ?? {} });

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
