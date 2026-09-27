import { render, screen, waitFor } from '@testing-library/react-native';
import { http, HttpResponse } from 'msw';

import { repoSchema, seedRepoDetail, toRepoDetails } from '@/entities/repo';
import { monitoring } from '@/shared/monitoring';
import { buildRepoDto, buildUserDto, USER_URL } from '@/test/github';
import { server } from '@/test/server';
import { createTestQueryClient, TestProviders } from '@/test/TestProviders';

import { RepoDetailsBody } from './RepoDetailsBody';

// The owner card itself crashes while rendering.
jest.mock('@/entities/owner', () => ({
  ...jest.requireActual<object>('@/entities/owner'),
  OwnerCard: () => {
    throw new Error('Owner card bug');
  },
}));

describe('RepoDetailsBody owner section', () => {
  it('contains a crash in the owner card; the rest of Details stays up', async () => {
    server.use(
      http.get(USER_URL, () => HttpResponse.json(buildUserDto('owner-1'))),
    );
    const capture = jest
      .spyOn(monitoring, 'captureException')
      .mockImplementation(() => undefined);
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const queryClient = createTestQueryClient();
    seedRepoDetail(
      queryClient,
      toRepoDetails(repoSchema.parse(buildRepoDto(1))),
      Date.now(),
    );

    await render(
      <TestProviders queryClient={queryClient}>
        <RepoDetailsBody repoRef={{ owner: 'owner-1', name: 'repo-1' }} />
      </TestProviders>,
    );

    expect(screen.getByRole('header', { name: 'repo-1' })).toBeOnTheScreen();
    expect(
      screen.getByRole('alert', { name: "Couldn't load owner details." }),
    ).toBeOnTheScreen();
    expect(capture).toHaveBeenCalled();
    // The owner profile request still completes; let it land inside the test.
    await waitFor(() => {
      expect(queryClient.isFetching()).toBe(0);
    });
    capture.mockRestore();
    consoleError.mockRestore();
  });
});
