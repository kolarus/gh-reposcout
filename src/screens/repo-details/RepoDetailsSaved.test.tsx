import { onlineManager } from '@tanstack/react-query';
import {
  act,
  cleanup,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { http, HttpResponse } from 'msw';

import { repoSchema, toRepoDetails } from '@/entities/repo';
import type { SavedRepoSnapshot } from '@/features/save-repo';
import { useRateLimit } from '@/shared/api';
import { savedAvatarStorage } from '@/shared/storage';
import {
  AVATAR_DATA_URI,
  buildRepoDto,
  buildUserDto,
  REPO_URL,
  USER_URL,
} from '@/test/github';
import { server } from '@/test/server';
import { createTestQueryClient, TestProviders } from '@/test/TestProviders';

import { RepoDetailsScreen } from './RepoDetailsScreen';

// Details with a saved snapshot (ADR-0020). The save-repo feature's own tests
// cover how snapshots are stored; here only the lookup is stubbed.
const mockSnapshot = jest.fn<SavedRepoSnapshot | undefined, []>();
jest.mock('@/features/save-repo', () => ({
  ...jest.requireActual<object>('@/features/save-repo'),
  useSavedSnapshot: () => mockSnapshot(),
}));

const snapshot: SavedRepoSnapshot = {
  version: 1,
  savedAt: '2026-09-20T10:00:00Z',
  refreshedAt: '2026-09-24T12:00:00Z',
  repo: toRepoDetails(
    repoSchema.parse(buildRepoDto(1, { description: 'As saved' })),
  ),
  owner: undefined,
};

async function renderDetails() {
  const queryClient = createTestQueryClient();
  await render(
    <TestProviders queryClient={queryClient}>
      <RepoDetailsScreen
        route={{ params: { owner: 'owner-1', name: 'repo-1' } }}
      />
    </TestProviders>,
  );
  return queryClient;
}

beforeEach(() => {
  jest.useFakeTimers({ now: Date.parse('2026-09-26T12:00:00Z') });
  useRateLimit.setState({ buckets: {} });
  savedAvatarStorage.clearAll();
  mockSnapshot.mockReturnValue(snapshot);
});

afterEach(async () => {
  await act(() => {
    jest.runOnlyPendingTimers();
  });
  await cleanup();
  onlineManager.setOnline(true);
  jest.useRealTimers();
});

describe('RepoDetailsScreen with a saved snapshot', () => {
  it('shows the snapshot, not an error, when GitHub can’t be reached', async () => {
    server.use(
      http.get(REPO_URL, () => HttpResponse.error()),
      http.get(USER_URL, () => HttpResponse.error()),
    );

    await renderDetails();

    expect(screen.getByText('As saved')).toBeOnTheScreen();
    expect(
      await screen.findByText('Saved copy · updated 2d ago'),
    ).toBeOnTheScreen();
    expect(screen.queryByText("Can't reach GitHub")).not.toBeOnTheScreen();
  });

  it('marks the snapshot as gone when GitHub no longer has the repo', async () => {
    server.use(
      http.get(REPO_URL, () =>
        HttpResponse.json({ message: 'Not Found' }, { status: 404 }),
      ),
      http.get(USER_URL, ({ params }) =>
        HttpResponse.json(buildUserDto(String(params['login']))),
      ),
    );

    await renderDetails();

    expect(
      await screen.findByText(
        'No longer available on GitHub. Showing your saved copy.',
      ),
    ).toBeOnTheScreen();
    expect(screen.getByText('As saved')).toBeOnTheScreen();
  });

  it('offline: the snapshot with its saved avatar, and the owner "not saved"', async () => {
    savedAvatarStorage.set('owner-1', AVATAR_DATA_URI);
    await act(() => {
      onlineManager.setOnline(false);
    });

    const queryClient = await renderDetails();

    expect(screen.getByText('As saved')).toBeOnTheScreen();
    expect(
      await screen.findByText(
        "Owner details weren't saved with this repository.",
      ),
    ).toBeOnTheScreen();
    expect(
      screen.getAllByTestId('avatar-image', { includeHiddenElements: true })[0],
    ).toHaveProp('source', { uri: AVATAR_DATA_URI, cache: 'force-cache' });
    await waitFor(() => {
      expect(queryClient.isFetching()).toBe(0);
    });
  });
});
