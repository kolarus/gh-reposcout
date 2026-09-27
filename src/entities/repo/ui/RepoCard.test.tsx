import { fireEvent, render, screen } from '@testing-library/react-native';
import { PixelRatio } from 'react-native';

import { ThemeProvider } from '@/shared/theme';

import { RepoCard } from './RepoCard';
import type { RepoSummary } from '../model/types';

const NOW = Date.parse('2026-09-26T12:00:00Z');
const repo: RepoSummary = {
  id: 1,
  owner: { login: 'facebook', avatarUrl: 'https://a.test/u/69631?v=4' },
  name: 'react-native',
  fullName: 'facebook/react-native',
  description: 'A framework for building native applications using React',
  stars: 125_400,
  language: 'C++',
  updatedAt: '2026-09-23T12:00:00Z',
};

describe('RepoCard', () => {
  it('shows name, description, compact stars, language and last update', async () => {
    await render(
      <ThemeProvider>
        <RepoCard repo={repo} now={NOW} onPress={jest.fn()} />
      </ThemeProvider>,
    );

    expect(screen.getByText('react-native')).toBeOnTheScreen();
    expect(screen.getByText(repo.description ?? '')).toBeOnTheScreen();
    expect(screen.getByText('125k')).toBeOnTheScreen();
    expect(screen.getByText('C++')).toBeOnTheScreen();
    expect(screen.getByText('Updated 3d ago')).toBeOnTheScreen();
  });

  it('is one button with a full spoken label, and passes the repo on press', async () => {
    const onPress = jest.fn();
    await render(
      <ThemeProvider>
        <RepoCard repo={repo} now={NOW} onPress={onPress} />
      </ThemeProvider>,
    );

    const card = screen.getByRole('button', {
      name: /^facebook\/react-native, A framework .*, 125,400 stars, C\+\+, Updated 3d ago$/,
    });
    await fireEvent.press(card);

    expect(onPress).toHaveBeenCalledWith(repo);
  });

  it('requests an avatar sized for the row, not the 460 px default', async () => {
    await render(
      <ThemeProvider>
        <RepoCard repo={repo} now={NOW} onPress={jest.fn()} />
      </ThemeProvider>,
    );

    // The avatar is decorative, so it's hidden from accessibility queries.
    const avatar = screen.getByTestId('avatar-image', {
      includeHiddenElements: true,
    });
    const px = 40 * PixelRatio.get();
    expect(avatar).toHaveProp('source', {
      uri: `https://a.test/u/69631?v=4&s=${String(px)}`,
      cache: 'force-cache',
    });
  });
});
