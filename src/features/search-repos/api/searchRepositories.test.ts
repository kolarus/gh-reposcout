import { http, HttpResponse } from 'msw';

import {
  buildSearchPage,
  capturedSearchResponse,
  SEARCH_URL,
} from '@/test/github';
import { server } from '@/test/server';

import { searchResponseSchema } from './search.schema';
import { searchRepositories } from './searchRepositories';

describe('searchResponseSchema', () => {
  it('accepts a real GitHub search response (contract)', () => {
    expect(searchResponseSchema.safeParse(capturedSearchResponse).success).toBe(
      true,
    );
  });
});

describe('searchRepositories', () => {
  it('sends the query, sort, page size and page, and maps the result', async () => {
    let url: URL | undefined;
    server.use(
      http.get(SEARCH_URL, ({ request }) => {
        url = new URL(request.url);
        return HttpResponse.json(buildSearchPage({ page: 3, total: 250 }));
      }),
    );

    const page = await searchRepositories(
      { query: 'react native', sort: 'stars' },
      3,
    );

    expect(Object.fromEntries(url?.searchParams ?? [])).toEqual({
      q: 'react native',
      sort: 'stars',
      order: 'desc',
      per_page: '100',
      page: '3',
    });
    expect(page.totalCount).toBe(250);
    expect(page.incompleteResults).toBe(false);
    expect(page.items).toHaveLength(50);
    expect(page.items[0]).toMatchObject({
      id: 201,
      fullName: 'owner-201/repo-201',
    });
  });

  it('sends no sort for best match', async () => {
    let url: URL | undefined;
    server.use(
      http.get(SEARCH_URL, ({ request }) => {
        url = new URL(request.url);
        return HttpResponse.json(buildSearchPage({ page: 1, total: 0 }));
      }),
    );

    await searchRepositories({ query: 'rn', sort: 'best-match' }, 1);

    expect(url?.searchParams.has('sort')).toBe(false);
    expect(url?.searchParams.has('order')).toBe(false);
  });
});
