import { render, screen } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';

import { ThemeProvider } from '@/shared/theme';

import { SearchField } from './SearchField';

const renderField = (loading: boolean) => (
  <ThemeProvider>
    <SearchField
      value="react"
      onChangeText={jest.fn()}
      onSubmit={jest.fn()}
      placeholder="Search repositories"
      clearLabel="Clear search"
      loading={loading}
      loadingLabel="Loading results"
    />
  </ThemeProvider>
);

describe('SearchField', () => {
  it('shows a labelled spinner while loading, and announces it once', async () => {
    const announce = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation(() => undefined);
    const { rerender } = await render(renderField(false));
    expect(screen.queryByLabelText('Loading results')).not.toBeOnTheScreen();

    await rerender(renderField(true));
    expect(screen.getByLabelText('Loading results')).toBeOnTheScreen();
    await rerender(renderField(true));

    await rerender(renderField(false));
    expect(screen.queryByLabelText('Loading results')).not.toBeOnTheScreen();
    expect(announce).toHaveBeenCalledTimes(1);
    expect(announce).toHaveBeenCalledWith('Loading results');
    announce.mockRestore();
  });
});
