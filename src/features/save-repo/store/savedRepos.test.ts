import { z } from 'zod';

import { repoSchema, toRepoDetails, type RepoDetails } from '@/entities/repo';
import { monitoring } from '@/shared/monitoring';
import { savedAvatarStorage, savedReposStorage } from '@/shared/storage';
import { buildRepoDto } from '@/test/github';

import { useSavedRepos } from './savedRepos';
import { clearSavedRepos } from '../hooks/useSaved';

const repo = (
  id: number,
  overrides: Record<string, unknown> = {},
): RepoDetails => toRepoDetails(repoSchema.parse(buildRepoDto(id, overrides)));
const KEY = 'saved-repos';
const persistedShape = z.object({
  state: z.object({
    byId: z.record(z.string(), z.unknown()),
    order: z.array(z.number()),
  }),
  version: z.number(),
});

beforeEach(() => {
  useSavedRepos.setState({ byId: {}, order: [], idByFullName: {} });
});

describe('useSavedRepos', () => {
  it('saves newest first, indexed by lowercased full name', () => {
    const { save } = useSavedRepos.getState();
    save(repo(1));
    save(repo(2, { full_name: 'Owner-2/Repo-2' }));
    save(repo(1));

    const state = useSavedRepos.getState();
    expect(state.order).toEqual([2, 1]);
    expect(state.idByFullName).toEqual({
      'owner-1/repo-1': 1,
      'owner-2/repo-2': 2,
    });
    expect(state.byId['1']).toMatchObject({ version: 1, owner: undefined });
  });

  it('removes a repo and its index entry', () => {
    const { save, remove } = useSavedRepos.getState();
    save(repo(1));
    save(repo(2));
    remove(1);

    const state = useSavedRepos.getState();
    expect(state.order).toEqual([2]);
    expect(state.byId['1']).toBeUndefined();
    expect(state.idByFullName).toEqual({ 'owner-2/repo-2': 2 });
  });

  it('clears every saved repo and every stored avatar at once', () => {
    const { save } = useSavedRepos.getState();
    save(repo(1));
    save(repo(2));
    savedAvatarStorage.set('owner-1', 'data:image/png;base64,AA');
    savedAvatarStorage.set('owner-2', 'data:image/png;base64,AA');

    clearSavedRepos();

    expect(useSavedRepos.getState()).toMatchObject({
      byId: {},
      order: [],
      idByFullName: {},
    });
    expect(savedAvatarStorage.getAllKeys()).toEqual([]);
  });

  it('follows newer data for a saved repo, and ignores older or unsaved', () => {
    const { save, refresh } = useSavedRepos.getState();
    save(repo(1, { stargazers_count: 10 }));
    const savedAt = Date.parse(
      useSavedRepos.getState().byId['1']?.refreshedAt ?? '',
    );

    refresh(repo(1, { stargazers_count: 5 }), savedAt - 1000);
    expect(useSavedRepos.getState().byId['1']?.repo.stars).toBe(10);

    refresh(
      repo(1, { stargazers_count: 20, full_name: 'owner-1/renamed' }),
      savedAt + 1000,
    );
    const state = useSavedRepos.getState();
    expect(state.byId['1']?.repo.stars).toBe(20);
    expect(state.byId['1']?.refreshedAt).toBe(
      new Date(savedAt + 1000).toISOString(),
    );
    // A rename moves the index entry.
    expect(state.idByFullName).toEqual({ 'owner-1/renamed': 1 });

    refresh(repo(9), savedAt + 1000);
    expect(useSavedRepos.getState().byId['9']).toBeUndefined();
  });

  it('persists to MMKV and restores, dropping a corrupted entry', async () => {
    const { save } = useSavedRepos.getState();
    save(repo(1, { description: null }));
    save(repo(2));
    const persisted = persistedShape.parse(
      JSON.parse(savedReposStorage.getString(KEY) ?? '{}'),
    );
    expect(persisted.state.order).toEqual([2, 1]);

    // The next launch finds entry 2 corrupted.
    const corrupted = JSON.stringify({
      ...persisted,
      state: {
        ...persisted.state,
        byId: { ...persisted.state.byId, '2': { version: 1, repo: 'broken' } },
      },
    });
    useSavedRepos.setState({ byId: {}, order: [], idByFullName: {} });
    savedReposStorage.set(KEY, corrupted);
    const log = jest
      .spyOn(monitoring, 'log')
      .mockImplementation(() => undefined);
    await useSavedRepos.persist.rehydrate();

    // Dropped, and reported rather than lost silently.
    expect(log).toHaveBeenCalledWith(
      'Dropped saved repos that failed validation',
      { dropped: 1 },
    );
    log.mockRestore();

    const state = useSavedRepos.getState();
    expect(state.order).toEqual([1]);
    expect(state.byId['1']?.repo.description).toBeUndefined();
    expect(state.idByFullName).toEqual({ 'owner-1/repo-1': 1 });
  });
});
