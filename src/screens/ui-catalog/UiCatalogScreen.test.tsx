import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeProvider, useThemePreference } from '@/shared/theme';

import { UiCatalogScreen } from './UiCatalogScreen';

afterEach(async () => {
  await act(() => {
    useThemePreference.getState().setPreference('system');
  });
});

describe('UiCatalogScreen', () => {
  it('switches the theme preference from the theme chips', async () => {
    await render(
      <ThemeProvider>
        <UiCatalogScreen />
      </ThemeProvider>,
    );

    expect(screen.getByRole('button', { name: 'System' })).toBeSelected();

    await fireEvent.press(screen.getByRole('button', { name: 'Dark' }));

    expect(useThemePreference.getState().preference).toBe('dark');
    expect(screen.getByRole('button', { name: 'Dark' })).toBeSelected();
  });
});
