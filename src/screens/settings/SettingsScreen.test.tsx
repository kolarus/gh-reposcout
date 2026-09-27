import { createStaticNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  queryOptions,
  useQuery,
  type QueryClient,
} from '@tanstack/react-query';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react-native';
import { Alert, Linking } from 'react-native';

import { clearSavedRepos } from '@/features/save-repo';
import { useRecentSearches } from '@/features/search-repos';
import { APP_VERSION } from '@/shared/config';
import { haptics } from '@/shared/lib';
import { useThemePreference } from '@/shared/theme';
import { Text } from '@/shared/ui';
import { expectAccessiblePressables } from '@/test/a11y';
import { createTestQueryClient, TestProviders } from '@/test/TestProviders';

import { SettingsScreen } from './SettingsScreen';

// The screen only coordinates the save-repo feature; its own tests cover
// what clearing removes (snapshots and avatars).
const mockSavedCount = jest.fn(() => 0);
jest.mock('@/features/save-repo', () => ({
  ...jest.requireActual<object>('@/features/save-repo'),
  useSavedCount: () => mockSavedCount(),
  clearSavedRepos: jest.fn(),
}));

const Navigation = createStaticNavigation(
  createNativeStackNavigator({
    screens: {
      Settings: SettingsScreen,
      UiCatalog: () => <Text>ui-catalog</Text>,
    },
  }),
);

/** A query some other screen is showing, e.g. the search on the Search tab. */
const onScreen = queryOptions({
  queryKey: ['on-screen'],
  queryFn: () => 'shown',
  initialData: 'shown',
});
function OnScreenQuery() {
  useQuery(onScreen);
  return null;
}
const offScreenKey = (n: number) =>
  queryOptions({ queryKey: ['off-screen', n] }).queryKey;

async function renderSettings(
  queryClient: QueryClient = createTestQueryClient(),
) {
  await render(
    <TestProviders queryClient={queryClient}>
      <OnScreenQuery />
      <Navigation />
    </TestProviders>,
  );
  return queryClient;
}

const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);

/** Presses a button in the confirmation dialog the last press opened. */
async function answerDialog(label: string) {
  const buttons = alert.mock.calls.at(-1)?.[2] ?? [];
  const button = buttons.find(candidate => candidate.text === label);
  expect(button).toBeDefined();
  await act(() => {
    button?.onPress?.();
  });
}

beforeEach(() => {
  jest.useFakeTimers();
  alert.mockClear();
  useRecentSearches.getState().clear();
  useThemePreference.getState().setPreference('system');
  mockSavedCount.mockReturnValue(0);
});

afterEach(async () => {
  await act(() => {
    jest.runOnlyPendingTimers();
  });
  await cleanup();
  jest.useRealTimers();
});

describe('SettingsScreen', () => {
  it('switches the theme with a selection haptic', async () => {
    const selection = jest.spyOn(haptics, 'selection');
    await renderSettings();

    expect(screen.getByRole('radio', { name: 'System' })).toBeChecked();
    await fireEvent.press(screen.getByRole('radio', { name: 'Dark' }));

    expect(screen.getByRole('radio', { name: 'Dark' })).toBeChecked();
    expect(useThemePreference.getState().preference).toBe('dark');
    expect(selection).toHaveBeenCalledTimes(1);
  });

  it('clears recent searches only once confirmed', async () => {
    useRecentSearches.getState().add('react');
    useRecentSearches.getState().add('expo');
    await renderSettings();
    const row = screen.getByRole('button', {
      name: 'Clear recent searches, 2 searches',
    });

    await fireEvent.press(row);
    expect(alert).toHaveBeenCalledWith(
      'Clear recent searches?',
      expect.any(String),
      expect.any(Array),
    );
    await answerDialog('Cancel');
    expect(useRecentSearches.getState().queries).toHaveLength(2);

    await fireEvent.press(row);
    await answerDialog('Clear');
    expect(useRecentSearches.getState().queries).toEqual([]);
    expect(
      screen.getByRole('button', { name: 'Clear recent searches, None' }),
    ).toBeDisabled();
  });

  it("clears cached results no screen is showing, keeping what's on screen", async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(offScreenKey(1), 'cached');
    queryClient.setQueryData(offScreenKey(2), 'cached');
    await renderSettings(queryClient);
    const row = screen.getByRole('button', { name: /^Clear cached results/ });
    expect(row).toBeEnabled();

    await fireEvent.press(row);
    await answerDialog('Clear');

    expect(queryClient.getQueryData(offScreenKey(1))).toBeUndefined();
    expect(queryClient.getQueryData(offScreenKey(2))).toBeUndefined();
    expect(queryClient.getQueryData(onScreen.queryKey)).toBe('shown');
    expect(
      screen.getByRole('button', { name: /^Clear cached results/ }),
    ).toBeDisabled();
  });

  it('removes saved repositories only once confirmed', async () => {
    mockSavedCount.mockReturnValue(3);
    await renderSettings();

    await fireEvent.press(
      screen.getByRole('button', {
        name: 'Remove saved repositories, 3 repositories',
      }),
    );
    expect(alert).toHaveBeenCalledWith(
      'Remove all saved repositories?',
      expect.any(String),
      expect.any(Array),
    );
    await answerDialog('Remove');

    expect(clearSavedRepos).toHaveBeenCalledTimes(1);
  });

  it('shows the version and links to the project', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    await renderSettings();

    expect(screen.getByLabelText(`Version, ${APP_VERSION}`)).toBeOnTheScreen();
    expect(
      screen.getByText(/Not affiliated with or endorsed by GitHub, Inc\./),
    ).toBeOnTheScreen();
    await fireEvent.press(
      screen.getByRole('link', { name: 'Architecture decisions' }),
    );
    expect(openURL).toHaveBeenCalledWith(
      'https://github.com/kolarus/gh-reposcout/tree/main/docs/adr',
    );
  });

  it('meets the accessibility floor', async () => {
    useRecentSearches.getState().add('react');
    await renderSettings();

    expectAccessiblePressables();
  });
});
