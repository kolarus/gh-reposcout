import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { http, HttpResponse } from 'msw';
import { Profiler } from 'react';

import { repoSchema, toRepoDetails } from '@/entities/repo';
import { haptics } from '@/shared/lib';
import { savedAvatarStorage } from '@/shared/storage';
import {
  AVATAR_BYTES,
  AVATAR_URL,
  buildRepoDto,
  buildUserDto,
  USER_URL,
} from '@/test/github';
import { server } from '@/test/server';
import { createTestQueryClient, TestProviders } from '@/test/TestProviders';

import { SaveToggle } from './SaveToggle';
import { useSavedRepos } from '../store/savedRepos';

const repoOf = (id: number) =>
  toRepoDetails(repoSchema.parse(buildRepoDto(id)));
const repos = [1, 2, 3].map(repoOf);

beforeEach(() => {
  useSavedRepos.setState({ byId: {}, order: [], idByFullName: {} });
  savedAvatarStorage.clearAll();
  server.use(
    http.get(
      AVATAR_URL,
      () =>
        new HttpResponse(AVATAR_BYTES, {
          headers: { 'content-type': 'image/png' },
        }),
    ),
    http.get(USER_URL, ({ params }) =>
      HttpResponse.json(buildUserDto(String(params['login']))),
    ),
  );
});

describe('SaveToggle', () => {
  it('saves and unsaves with a haptic, saying which it will do', async () => {
    const impact = jest.spyOn(haptics, 'impact');
    const queryClient = createTestQueryClient();
    await render(
      <TestProviders queryClient={queryClient}>
        <SaveToggle repo={repoOf(1)} />
      </TestProviders>,
    );

    await fireEvent.press(
      screen.getByRole('button', { name: 'Save owner-1/repo-1' }),
    );
    const saved = screen.getByRole('button', {
      name: 'Remove owner-1/repo-1 from Saved',
    });
    expect(saved).toBeSelected();
    expect(useSavedRepos.getState().order).toEqual([1]);
    await waitFor(() => {
      expect(queryClient.isFetching()).toBe(0);
    });

    await fireEvent.press(saved);
    expect(
      screen.getByRole('button', { name: 'Save owner-1/repo-1' }),
    ).not.toBeSelected();
    expect(useSavedRepos.getState().order).toEqual([]);
    expect(impact).toHaveBeenCalledTimes(2);
  });

  it('toggling one repo re-renders only that repo’s toggle', async () => {
    const queryClient = createTestQueryClient();
    const renders = new Map<string, number>();
    const count = (id: string) => {
      renders.set(id, (renders.get(id) ?? 0) + 1);
    };
    await render(
      <TestProviders queryClient={queryClient}>
        {repos.map(repo => (
          <Profiler key={repo.id} id={String(repo.id)} onRender={count}>
            <SaveToggle repo={repo} />
          </Profiler>
        ))}
      </TestProviders>,
    );
    renders.clear();

    await fireEvent.press(
      screen.getByRole('button', { name: 'Save owner-2/repo-2' }),
    );
    await waitFor(() => {
      expect(queryClient.isFetching()).toBe(0);
    });

    expect(renders.get('2')).toBeGreaterThan(0);
    expect(renders.has('1')).toBe(false);
    expect(renders.has('3')).toBe(false);
  });
});
