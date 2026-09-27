import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  createStaticNavigation,
  type StaticParamList,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { lazy } from 'react';

import { SavedScreen } from '@/screens/saved';
import { SearchScreen } from '@/screens/search';
import { strings } from '@/shared/i18n';

import { ScreenLayout } from './ScreenLayout';
import { tabIcon } from './TabIcon';

/*
 * Screens that aren't needed at launch load on first navigation (ADR-0006).
 * React Navigation's static API has no `getComponent`, so React.lazy is used;
 * ScreenLayout provides the Suspense boundary.
 */
const RepoDetailsScreen = lazy(() =>
  import('@/screens/repo-details').then(m => ({
    default: m.RepoDetailsScreen,
  })),
);
const SettingsScreen = lazy(() =>
  import('@/screens/settings').then(m => ({ default: m.SettingsScreen })),
);
const UiCatalogScreen = lazy(() =>
  import('@/screens/ui-catalog').then(m => ({ default: m.UiCatalogScreen })),
);

const useIsDevelopment = () => __DEV__;

// The static API types `getId`'s params loosely, so narrow them here.
const repoScreenId = (params: object | undefined): string | undefined =>
  params !== undefined &&
  'owner' in params &&
  'name' in params &&
  typeof params.owner === 'string' &&
  typeof params.name === 'string'
    ? `${params.owner}/${params.name}`.toLowerCase()
    : undefined;

const Tabs = createBottomTabNavigator({
  screenLayout: ScreenLayout,
  screens: {
    Search: {
      screen: SearchScreen,
      options: { title: strings.tabs.search, tabBarIcon: tabIcon('search') },
      linking: '',
    },
    Saved: {
      screen: SavedScreen,
      options: { title: strings.tabs.saved, tabBarIcon: tabIcon('bookmark') },
      linking: 'saved',
    },
    Settings: {
      screen: SettingsScreen,
      options: { title: strings.tabs.settings, tabBarIcon: tabIcon('gear') },
      linking: 'settings',
    },
  },
});

/**
 * Root: tabs, with RepoDetails on top so it covers the tab bar and is reached
 * the same way from any tab or a deep link (ADR-0006).
 */
export const RootStack = createNativeStackNavigator({
  initialRouteName: 'Tabs',
  screenLayout: ScreenLayout,
  // iOS labels Back with the previous route's title, which would be "Tabs";
  // a bare chevron matches iOS 26 system apps. Android shows no label anyway.
  screenOptions: { headerBackButtonDisplayMode: 'minimal' },
  screens: {
    Tabs: {
      screen: Tabs,
      options: { headerShown: false },
    },
    RepoDetails: {
      screen: RepoDetailsScreen,
      // One screen per repo: opening another repo (a link, a saved repo)
      // stacks on top instead of replacing the open one, so Back returns to it.
      getId: ({ params }) => repoScreenId(params),
      options: { title: '' },
      linking: 'repo/:owner/:name',
    },
    UiCatalog: {
      screen: UiCatalogScreen,
      if: useIsDevelopment,
      options: { title: strings.dev.uiCatalog },
      linking: 'dev/ui-catalog',
    },
  },
});

export const Navigation = createStaticNavigation(RootStack);

type RootStackParamList = StaticParamList<typeof RootStack>;

declare global {
  // Types `useNavigation()` everywhere without generics (ADR-0006).
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
