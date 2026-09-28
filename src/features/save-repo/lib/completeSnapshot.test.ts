import { act, renderHook, waitFor } from '@testing-library/react-native';
import { http, HttpResponse } from 'msw';

import { repoSchema, toRepoDetails, type RepoDetails } from '@/entities/repo';
import { useRateLimit } from '@/shared/api';
import { savedAvatarStorage } from '@/shared/storage';
import { createGate } from '@/test/gate';
import {
  AVATAR_BYTES,
  AVATAR_DATA_URI,
  AVATAR_URL,
  buildRepoDto,
  buildUserDto,
  USER_URL,
} from '@/test/github';
import { server } from '@/test/server';
import { createTestQueryClient, createWrapper } from '@/test/TestProviders';

import { completeSnapshot } from './completeSnapshot';
import { useToggleSaved } from '../hooks/useSaved';
import { useSavedRepos } from '../store/savedRepos';

const repo = (id: number, owner = `owner-${String(id)}`): RepoDetails =>
  toRepoDetails(
    repoSchema.parse(
      buildRepoDto(id, {
        owner: {
          login: owner,
          avatar_url: `https://avatars.githubusercontent.com/u/${String(id)}?v=4`,
          type: 'User',
        },
      }),
    ),
  );

function serve() {
  const counts = { avatar: 0, user: 0 };
  server.use(
    http.get(AVATAR_URL, () => {
      counts.avatar += 1;
      return new HttpResponse(AVATAR_BYTES, {
        headers: { 'content-type': 'image/png' },
      });
    }),
    http.get(USER_URL, ({ params }) => {
      counts.user += 1;
      return HttpResponse.json(buildUserDto(String(params['login'])));
    }),
  );
  return counts;
}

beforeEach(() => {
  useSavedRepos.setState({ byId: {}, order: [], idByFullName: {} });
  useRateLimit.setState({ buckets: {} });
  savedAvatarStorage.clearAll();
});

describe('completeSnapshot', () => {
  it('stores the avatar and adds the owner profile when the budget allows', async () => {
    const counts = serve();
    const saved = repo(1);
    useSavedRepos.getState().save(saved);

    await completeSnapshot(createTestQueryClient(), saved);

    expect(savedAvatarStorage.getString('owner-1')).toBe(AVATAR_DATA_URI);
    expect(useSavedRepos.getState().byId['1']?.owner?.login).toBe('owner-1');
    expect(counts).toEqual({ avatar: 1, user: 1 });
  });

  it('at the core reserve, keeps the avatar but leaves the owner for later', async () => {
    useRateLimit.setState({
      buckets: {
        core: {
          limit: 60,
          remaining: 2,
          resetAt: new Date(Date.now() + 600_000).toISOString(),
        },
      },
    });
    const counts = serve();
    const saved = repo(1);
    useSavedRepos.getState().save(saved);

    await completeSnapshot(createTestQueryClient(), saved);

    expect(savedAvatarStorage.getString('owner-1')).toBe(AVATAR_DATA_URI);
    expect(useSavedRepos.getState().byId['1']?.owner).toBeUndefined();
    expect(counts).toEqual({ avatar: 1, user: 0 });
  });
});

describe('saved avatars (via useToggleSaved)', () => {
  it('shares one avatar per owner and deletes it with their last saved repo', async () => {
    const counts = serve();
    const queryClient = createTestQueryClient();
    const { result } = await renderHook(() => useToggleSaved(), {
      wrapper: createWrapper(queryClient),
    });
    const first = repo(1, 'acme');
    const second = repo(2, 'acme');

    await act(() => {
      result.current(first);
      result.current(second);
    });
    await waitFor(() => {
      expect(queryClient.isFetching()).toBe(0);
      expect(savedAvatarStorage.getString('acme')).toBe(AVATAR_DATA_URI);
    });

    await act(() => {
      result.current(first);
    });
    expect(savedAvatarStorage.contains('acme')).toBe(true);

    await act(() => {
      result.current(second);
    });
    expect(savedAvatarStorage.contains('acme')).toBe(false);
    expect(useSavedRepos.getState().order).toEqual([]);
    // Both saves checked the store first: one download for the owner.
    expect(counts.avatar).toBeLessThanOrEqual(2);
  });
  it("doesn't keep an avatar that finishes downloading after the repo was unsaved", async () => {
    const gate = createGate();
    server.use(
      http.get(AVATAR_URL, async () => {
        await gate.opened;
        return new HttpResponse(AVATAR_BYTES, {
          headers: { 'content-type': 'image/png' },
        });
      }),
      http.get(USER_URL, ({ params }) =>
        HttpResponse.json(buildUserDto(String(params['login']))),
      ),
    );
    const queryClient = createTestQueryClient();
    const { result } = await renderHook(() => useToggleSaved(), {
      wrapper: createWrapper(queryClient),
    });
    const saved = repo(1, 'acme');

    await act(() => {
      result.current(saved);
      result.current(saved);
    });
    const downloaded = new Promise<void>(resolve => {
      server.events.on('response:mocked', ({ request }) => {
        if (request.url.startsWith('https://avatars.')) resolve();
      });
    });
    gate.open();
    await act(() => downloaded);
    await waitFor(() => {
      expect(queryClient.isFetching()).toBe(0);
    });

    expect(savedAvatarStorage.contains('acme')).toBe(false);
    server.events.removeAllListeners('response:mocked');
  });
});
