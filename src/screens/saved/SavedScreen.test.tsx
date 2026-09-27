import {
  createStaticNavigation,
  type StaticScreenProps,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react-native';

import { repoSchema, toRepoDetails } from '@/entities/repo';
import type { SavedRepoSnapshot } from '@/features/save-repo';
import { savedAvatarStorage } from '@/shared/storage';
import { Text } from '@/shared/ui';
import { AVATAR_DATA_URI, buildRepoDto } from '@/test/github';
import { createTestQueryClient, TestProviders } from '@/test/TestProviders';

import { SavedScreen } from './SavedScreen';

// The screen composes what the save-repo feature hands it; the feature's own
// tests cover the store. Here only the list is stubbed.
const mockSavedList = jest.fn<SavedRepoSnapshot[], []>(() => []);
jest.mock('@/features/save-repo', () => ({
  ...jest.requireActual<object>('@/features/save-repo'),
  useSavedList: () => mockSavedList(),
}));

function DetailsProbe({
  route,
}: StaticScreenProps<{ owner: string; name: string }>) {
  return <Text>{`details:${route.params.owner}/${route.params.name}`}</Text>;
}

const Navigation = createStaticNavigation(
  createNativeStackNavigator({
    screens: { Saved: SavedScreen, RepoDetails: DetailsProbe },
  }),
);

const snapshotOf = (id: number): SavedRepoSnapshot => ({
  version: 1,
  savedAt: '2026-09-20T10:00:00Z',
  refreshedAt: '2026-09-20T10:00:00Z',
  repo: toRepoDetails(repoSchema.parse(buildRepoDto(id))),
  owner: undefined,
});

async function renderSaved() {
  await render(
    <TestProviders queryClient={createTestQueryClient()}>
      <Navigation />
    </TestProviders>,
  );
}

beforeEach(() => {
  jest.useFakeTimers();
  savedAvatarStorage.clearAll();
  mockSavedList.mockReturnValue([]);
});

afterEach(async () => {
  await act(() => {
    jest.runOnlyPendingTimers();
  });
  await cleanup();
  jest.useRealTimers();
});

describe('SavedScreen', () => {
  it('explains saving when nothing is saved', async () => {
    await renderSaved();

    expect(
      screen.getByRole('header', { name: 'No saved repositories yet' }),
    ).toBeOnTheScreen();
  });

  it('lists saved repos in order, with their saved avatars, and opens one', async () => {
    mockSavedList.mockReturnValue([snapshotOf(2), snapshotOf(1)]);
    savedAvatarStorage.set('owner-2', AVATAR_DATA_URI);

    await renderSaved();

    expect(
      screen.getByRole('header', { name: '2 saved repositories' }),
    ).toBeOnTheScreen();
    const second = screen.getByRole('button', { name: /^owner-2\/repo-2,/ });
    expect(
      screen.getByRole('button', { name: /^owner-1\/repo-1,/ }),
    ).toBeOnTheScreen();
    // Saved avatars come from the device, so the list works offline.
    expect(
      screen.getAllByTestId('avatar-image', { includeHiddenElements: true })[0],
    ).toHaveProp('source', { uri: AVATAR_DATA_URI, cache: 'force-cache' });

    await fireEvent.press(second);
    expect(await screen.findByText('details:owner-2/repo-2')).toBeOnTheScreen();
  });
});
