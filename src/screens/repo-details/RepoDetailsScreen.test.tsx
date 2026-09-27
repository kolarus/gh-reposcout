import type { QueryClient } from '@tanstack/react-query';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { http, HttpResponse } from 'msw';
import { Linking, Share } from 'react-native';

import {
  repoSchema,
  seedRepoDetail,
  toRepoDetails,
  type RepoDetails,
} from '@/entities/repo';
import { useRateLimit } from '@/shared/api';
import { haptics } from '@/shared/lib';
import { savedAvatarStorage } from '@/shared/storage';
import { expectAccessiblePressables } from '@/test/a11y';
import { createGate } from '@/test/gate';
import {
  AVATAR_BYTES,
  AVATAR_URL,
  buildRepoDto,
  buildUserDto,
  REPO_URL,
  USER_URL,
} from '@/test/github';
import { pullToRefresh } from '@/test/pullToRefresh';
import { server } from '@/test/server';
import { createTestQueryClient, TestProviders } from '@/test/TestProviders';

import { RepoDetailsScreen } from './RepoDetailsScreen';

const MINUTE = 60 * 1000;

const repoDto = (id: number, overrides: Record<string, unknown> = {}) =>
  buildRepoDto(id, overrides);
const repoOf = (dto: Record<string, unknown>): RepoDetails =>
  toRepoDetails(repoSchema.parse(dto));

async function renderDetails(
  queryClient: QueryClient,
  owner: string,
  name: string,
) {
  return render(
    <TestProviders queryClient={queryClient}>
      <RepoDetailsScreen route={{ params: { owner, name } }} />
    </TestProviders>,
  );
}

/** Serves repos and profiles, counting requests per endpoint. */
function serveGitHub({
  repos = {},
  userStatus = 200,
}: {
  repos?: Record<string, Record<string, unknown>>;
  userStatus?: number;
} = {}) {
  const counts = { repo: 0, user: 0 };
  server.use(
    http.get(REPO_URL, ({ params }) => {
      counts.repo += 1;
      const dto = repos[`${String(params['owner'])}/${String(params['name'])}`];
      return dto === undefined
        ? HttpResponse.json({ message: 'Not Found' }, { status: 404 })
        : HttpResponse.json(dto);
    }),
    // The avatar CDN (saving a repo stores its owner's avatar).
    http.get(
      AVATAR_URL,
      () =>
        new HttpResponse(AVATAR_BYTES, {
          headers: { 'content-type': 'image/png' },
        }),
    ),
    http.get(USER_URL, ({ params }) => {
      counts.user += 1;
      const login = String(params['login']);
      return userStatus === 200
        ? HttpResponse.json(
            buildUserDto(login, { name: `Profile of ${login}` }),
          )
        : HttpResponse.json({}, { status: userStatus });
    }),
  );
  return counts;
}

beforeEach(() => {
  jest.useFakeTimers();
  useRateLimit.setState({ buckets: {} });
});

afterEach(async () => {
  await act(() => {
    jest.runOnlyPendingTimers();
  });
  await cleanup();
  jest.useRealTimers();
});

describe('RepoDetailsScreen', () => {
  it('opens a search result at once with no repo request; only the owner profile loads', async () => {
    const counts = serveGitHub();
    const queryClient = createTestQueryClient();
    seedRepoDetail(queryClient, repoOf(repoDto(1)), Date.now());

    await renderDetails(queryClient, 'owner-1', 'repo-1');

    // Rendered from the cache straight away: no skeleton, no request.
    expect(screen.getByRole('header', { name: 'repo-1' })).toBeOnTheScreen();
    expect(screen.getByLabelText(/^Stars: [\d,]+$/)).toBeOnTheScreen();
    expect(await screen.findByText('Profile of owner-1')).toBeOnTheScreen();
    expect(counts).toEqual({ repo: 0, user: 1 });
  });

  it('costs no owner request for a second repo by the same owner', async () => {
    const counts = serveGitHub();
    const queryClient = createTestQueryClient();
    const sameOwner = {
      owner: { login: 'acme', avatar_url: 'https://a.test/a', type: 'User' },
    };
    seedRepoDetail(queryClient, repoOf(repoDto(1, sameOwner)), Date.now());
    seedRepoDetail(queryClient, repoOf(repoDto(2, sameOwner)), Date.now());

    await renderDetails(queryClient, 'acme', 'repo-1');
    await screen.findByText('Profile of acme');
    await cleanup();
    await renderDetails(queryClient, 'acme', 'repo-2');

    expect(screen.getByRole('header', { name: 'repo-2' })).toBeOnTheScreen();
    expect(await screen.findByText('Profile of acme')).toBeOnTheScreen();
    expect(counts).toEqual({ repo: 0, user: 1 });
  });

  it('a deep link shows the skeleton, then costs one repo and one owner request', async () => {
    const gate = createGate();
    const counts = { repo: 0, user: 0 };
    server.use(
      http.get(REPO_URL, async () => {
        counts.repo += 1;
        await gate.opened;
        return HttpResponse.json(repoDto(5));
      }),
      http.get(USER_URL, ({ params }) => {
        counts.user += 1;
        return HttpResponse.json(
          buildUserDto(String(params['login']), { name: 'Owner Five' }),
        );
      }),
    );

    await renderDetails(createTestQueryClient(), 'owner-5', 'repo-5');

    expect(
      await screen.findByTestId('repo-details-skeleton'),
    ).toBeOnTheScreen();
    gate.open();
    expect(
      await screen.findByRole('header', { name: 'repo-5' }),
    ).toBeOnTheScreen();
    expect(await screen.findByText('Owner Five')).toBeOnTheScreen();
    expect(counts).toEqual({ repo: 1, user: 1 });
  });

  it('refreshes data from an old search in the background (one request)', async () => {
    const counts = serveGitHub({
      repos: {
        'owner-1/repo-1': repoDto(1, { description: 'Fresh from GitHub' }),
      },
    });
    const queryClient = createTestQueryClient();
    seedRepoDetail(
      queryClient,
      repoOf(repoDto(1, { description: 'From an old search' })),
      Date.now() - 11 * MINUTE,
    );

    await renderDetails(queryClient, 'owner-1', 'repo-1');

    expect(screen.getByText('From an old search')).toBeOnTheScreen();
    expect(await screen.findByText('Fresh from GitHub')).toBeOnTheScreen();
    expect(counts.repo).toBe(1);
  });

  it('at the core reserve, the owner profile waits for "Load now"', async () => {
    useRateLimit.setState({
      buckets: {
        core: {
          limit: 60,
          remaining: 3,
          resetAt: new Date(Date.now() + 20 * MINUTE).toISOString(),
        },
      },
    });
    const counts = serveGitHub();
    const queryClient = createTestQueryClient();
    seedRepoDetail(queryClient, repoOf(repoDto(1)), Date.now());

    await renderDetails(queryClient, 'owner-1', 'repo-1');

    expect(
      await screen.findByText(
        /Owner details are paused .* resets in 20 minutes/,
      ),
    ).toBeOnTheScreen();
    expect(counts.user).toBe(0);

    await fireEvent.press(screen.getByRole('button', { name: 'Load now' }));

    expect(await screen.findByText('Profile of owner-1')).toBeOnTheScreen();
    expect(counts.user).toBe(1);
  });

  it('keeps an owner failure inside the owner card, with Retry', async () => {
    const counts = serveGitHub({ userStatus: 500 });
    const queryClient = createTestQueryClient();
    seedRepoDetail(queryClient, repoOf(repoDto(1)), Date.now());

    await renderDetails(queryClient, 'owner-1', 'repo-1');

    expect(
      await screen.findByText("Couldn't load owner details."),
    ).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: 'repo-1' })).toBeOnTheScreen();

    serveGitHub();
    await fireEvent.press(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Profile of owner-1')).toBeOnTheScreen();
    expect(counts.user).toBe(1);
  });

  it('says so when the repository no longer exists', async () => {
    serveGitHub();

    await renderDetails(createTestQueryClient(), 'gone', 'repo');

    expect(
      await screen.findByRole('header', { name: 'Repository not found' }),
    ).toBeOnTheScreen();
  });

  it('keeps showing data with a notice when the hourly limit blocks a refresh', async () => {
    server.use(
      http.get(REPO_URL, () =>
        HttpResponse.json(
          { message: 'API rate limit exceeded' },
          {
            status: 403,
            headers: {
              'x-ratelimit-remaining': '0',
              'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 600),
              'x-ratelimit-resource': 'core',
            },
          },
        ),
      ),
      http.get(USER_URL, () => HttpResponse.json(buildUserDto('owner-1'))),
    );
    const queryClient = createTestQueryClient();
    seedRepoDetail(queryClient, repoOf(repoDto(1)), Date.now() - 11 * MINUTE);

    await renderDetails(queryClient, 'owner-1', 'repo-1');

    expect(
      await screen.findByText(
        /hourly limit is used up\. Showing what was loaded earlier/,
      ),
    ).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: 'repo-1' })).toBeOnTheScreen();
  });

  it('saves the repo from Details with a haptic, and unsaves it', async () => {
    serveGitHub();
    const impact = jest.spyOn(haptics, 'impact');
    const queryClient = createTestQueryClient();
    seedRepoDetail(queryClient, repoOf(repoDto(1)), Date.now());

    await renderDetails(queryClient, 'owner-1', 'repo-1');
    await fireEvent.press(
      screen.getByRole('button', { name: 'Save owner-1/repo-1' }),
    );
    expect(impact).toHaveBeenCalledTimes(1);

    const saved = screen.getByRole('button', {
      name: 'Remove owner-1/repo-1 from Saved',
    });
    expect(saved).toBeSelected();
    await waitFor(() => {
      expect(queryClient.isFetching()).toBe(0);
    });

    // Leave the shared saved-repos store as the other tests expect it.
    await fireEvent.press(saved);
    expect(
      screen.getByRole('button', { name: 'Save owner-1/repo-1' }),
    ).not.toBeSelected();
  });

  it("saving and unsaving don't swap the avatars (a new source would flicker)", async () => {
    serveGitHub();
    const queryClient = createTestQueryClient();
    seedRepoDetail(queryClient, repoOf(repoDto(1)), Date.now());
    await renderDetails(queryClient, 'owner-1', 'repo-1');
    await screen.findByText('Profile of owner-1');
    const avatarSources = () =>
      screen
        .getAllByTestId('avatar-image', { includeHiddenElements: true })
        .map(image => {
          const source: unknown = image.props['source'];
          return source;
        });
    const before = avatarSources();
    expect(before).toHaveLength(2);

    await fireEvent.press(
      screen.getByRole('button', { name: 'Save owner-1/repo-1' }),
    );
    // Saving stores the owner's avatar on the device...
    await waitFor(() => {
      expect(savedAvatarStorage.contains('owner-1')).toBe(true);
    });
    // ...but the images on screen keep their source.
    expect(avatarSources()).toEqual(before);

    await fireEvent.press(
      screen.getByRole('button', { name: 'Remove owner-1/repo-1 from Saved' }),
    );
    expect(savedAvatarStorage.contains('owner-1')).toBe(false);
    expect(avatarSources()).toEqual(before);
  });

  it('opens the repo and its https website, and shares its link', async () => {
    serveGitHub();
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    const share = jest
      .spyOn(Share, 'share')
      .mockResolvedValue({ action: 'sharedAction', activityType: undefined });
    const queryClient = createTestQueryClient();
    const repo = repoOf(repoDto(1, { homepage: 'https://site.test' }));
    seedRepoDetail(queryClient, repo, Date.now());

    await renderDetails(queryClient, 'owner-1', 'repo-1');
    await fireEvent.press(
      screen.getByRole('button', { name: 'Open on GitHub' }),
    );
    await fireEvent.press(
      screen.getByRole('button', { name: 'Website: site.test' }),
    );
    const impact = jest.spyOn(haptics, 'impact');
    await fireEvent.press(screen.getByRole('button', { name: 'Share' }));

    expect(impact).toHaveBeenCalledTimes(1);
    expect(openURL).toHaveBeenNthCalledWith(1, repo.htmlUrl);
    expect(openURL).toHaveBeenNthCalledWith(2, 'https://site.test');
    await waitFor(() => {
      expect(share).toHaveBeenCalledTimes(1);
    });
    openURL.mockRestore();
    share.mockRestore();
  });

  it('pull-to-refresh refetches the repo only, with a haptic', async () => {
    const counts = serveGitHub({ repos: { 'owner-1/repo-1': repoDto(1) } });
    const impact = jest.spyOn(haptics, 'impact');
    const queryClient = createTestQueryClient();
    seedRepoDetail(queryClient, repoOf(repoDto(1)), Date.now());
    await renderDetails(queryClient, 'owner-1', 'repo-1');
    await screen.findByText('Profile of owner-1');

    await pullToRefresh();

    expect(impact).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(queryClient.isFetching()).toBe(0);
    });
    expect(counts).toEqual({ repo: 1, user: 1 });
  });

  it('meets the accessibility floor with everything loaded', async () => {
    serveGitHub();
    const queryClient = createTestQueryClient();
    seedRepoDetail(
      queryClient,
      repoOf(repoDto(1, { homepage: 'https://site.test' })),
      Date.now(),
    );
    await renderDetails(queryClient, 'owner-1', 'repo-1');
    await screen.findByText('Profile of owner-1');

    expectAccessiblePressables();
  });
});
